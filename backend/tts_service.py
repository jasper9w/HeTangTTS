import base64
import requests
from pathlib import Path
from loguru import logger
from pydub import AudioSegment
from pydub.effects import speedup


class TTSService:
    """TTS 配音服务"""

    def __init__(self):
        self.default_emo_control_method = 0
        self.default_emo_weight = 1.0

    def trim_leading_silence(
        self,
        audio_file: str,
        silence_thresh_db: float = -50.0,
        keep_ms: int = 50,
        output_file: str = None
    ) -> dict:
        """
        删除音频开头的静音部分

        参数:
            audio_file: 输入音频文件路径
            silence_thresh_db: 静音阈值（dB），低于此值视为静音，默认 -50dB
            keep_ms: 保留的静音时长（毫秒），默认 50ms
            output_file: 输出文件路径，如果为None则覆盖原文件

        返回:
            dict: {'success': bool, 'output': str, 'trimmed_ms': int, 'error': str}
        """
        try:
            logger.info(f"处理音频开头静音: {audio_file}")

            # 加载音频文件
            audio = AudioSegment.from_file(audio_file)

            # 检测开头静音的结束位置
            silence_end_ms = 0
            chunk_size = 10  # 每10ms检测一次

            for i in range(0, len(audio), chunk_size):
                chunk = audio[i:i + chunk_size]
                if chunk.dBFS > silence_thresh_db:
                    silence_end_ms = i
                    break
            else:
                # 整个音频都是静音
                silence_end_ms = len(audio)

            # 计算需要裁剪的位置（保留 keep_ms 的静音）
            trim_position = max(0, silence_end_ms - keep_ms)

            if trim_position > 0:
                # 裁剪音频
                trimmed_audio = audio[trim_position:]
                logger.info(f"裁剪开头静音: {trim_position}ms (保留 {keep_ms}ms)")

                # 确定输出文件
                if output_file is None:
                    output_file = audio_file

                # 保存处理后的音频
                trimmed_audio.export(output_file, format="wav")
                logger.info(f"静音处理完成: {output_file}")

                return {
                    "success": True,
                    "output": output_file,
                    "trimmed_ms": trim_position
                }
            else:
                logger.info("开头静音不超过保留阈值，无需裁剪")
                return {
                    "success": True,
                    "output": audio_file,
                    "trimmed_ms": 0
                }

        except Exception as e:
            error_msg = f"音频静音处理失败: {str(e)}"
            logger.exception(error_msg)
            return {"success": False, "error": error_msg}

    def adjust_speed(self, audio_file: str, speed: float, output_file: str = None) -> dict:
        """
        调整音频播放速度

        参数:
            audio_file: 输入音频文件路径
            speed: 速度倍率（0.5-2.0），大于1加速，小于1减速
            output_file: 输出文件路径，如果为None则覆盖原文件

        返回:
            dict: {'success': bool, 'output': str, 'error': str}
        """
        try:
            if speed <= 0:
                return {"success": False, "error": "速度倍率必须大于0"}

            if speed == 1.0:
                logger.debug("速度倍率为1.0，无需调整")
                return {"success": True, "output": audio_file}

            logger.info(f"调整音频速度: {audio_file}, 倍率: {speed}x")

            # 加载音频文件
            audio = AudioSegment.from_file(audio_file)

            # 调整速度
            # 方法1: 使用 speedup (保持音高)
            if speed > 1.0:
                # 加速
                adjusted_audio = speedup(audio, playback_speed=speed)
            else:
                # 减速：通过改变帧率实现
                # 先改变帧率（不改变播放速度）
                new_frame_rate = int(audio.frame_rate * speed)
                adjusted_audio = audio._spawn(audio.raw_data, overrides={
                    "frame_rate": new_frame_rate
                })
                # 然后重新采样回原始帧率
                adjusted_audio = adjusted_audio.set_frame_rate(audio.frame_rate)

            # 确定输出文件
            if output_file is None:
                output_file = audio_file

            # 保存调整后的音频
            adjusted_audio.export(output_file, format="wav")

            logger.info(f"速度调整完成: {output_file}")
            return {"success": True, "output": output_file}

        except Exception as e:
            error_msg = f"音频速度调整失败: {str(e)}"
            logger.exception(error_msg)
            return {"success": False, "error": error_msg}

    def generate(
        self,
        server_url: str,
        text: str,
        spk_audio_file: str,
        output_file: str,
        speed: float = 1.0,
        emo_control_method: int = 0,
        emo_ref_file: str = None,
        emo_weight: float = 1.0,
        emo_vec: list = None,
        emo_text: str = None,
        emo_random: bool = False,
    ) -> dict:
        """
        调用 TTS API 生成配音

        参数:
            server_url: 服务器地址
            text: 要合成的文本
            spk_audio_file: 本地说话人参考音频文件路径
            output_file: 输出音频文件路径
            speed: 语速倍率
            emo_control_method: 情感控制方式
                0 - 无情感控制
                1 - 使用参考音频控制情感
                2 - 使用情感向量控制
                3 - 使用文本描述控制情感
            emo_ref_file: 情感参考音频文件路径
            emo_weight: 情感权重
            emo_vec: 情感向量，8维列表
            emo_text: 情感文本描述
            emo_random: 是否随机情感

        返回:
            dict: {'success': bool, 'output': str, 'error': str}
        """
        try:
            # 检查参考音频文件是否存在
            if not Path(spk_audio_file).exists():
                error_msg = f"参考音频文件不存在: {spk_audio_file}"
                logger.error(error_msg)
                return {"success": False, "error": error_msg}

            # 读取并编码说话人参考音频
            with open(spk_audio_file, "rb") as f:
                spk_audio_base64 = base64.b64encode(f.read()).decode("utf-8")

            # 构建请求数据
            payload = {
                "text": text,
                "spk_audio_base64": spk_audio_base64,
                "emo_control_method": emo_control_method,
                "emo_weight": emo_weight,
                "emo_random": emo_random,
            }

            # 如果有情感参考音频
            if emo_ref_file and emo_control_method == 1:
                if not Path(emo_ref_file).exists():
                    logger.warning(f"情感参考音频文件不存在: {emo_ref_file}")
                else:
                    with open(emo_ref_file, "rb") as f:
                        payload["emo_ref_base64"] = base64.b64encode(f.read()).decode(
                            "utf-8"
                        )

            # 如果使用情感向量
            if emo_vec and emo_control_method == 2:
                payload["emo_vec"] = emo_vec

            # 如果使用情感文本
            if emo_text and emo_control_method == 3:
                payload["emo_text"] = emo_text

            logger.info(f"发送 TTS 请求到: {server_url}")
            logger.debug(f"文本长度: {len(text)} 字符")
            logger.debug(f"情感控制方式: {emo_control_method}")

            # 发送请求
            response = requests.post(server_url, json=payload, timeout=60)

            if response.status_code == 200:
                # 确保输出目录存在
                output_path = Path(output_file)
                output_path.parent.mkdir(parents=True, exist_ok=True)

                # 保存音频文件
                with open(output_file, "wb") as f:
                    f.write(response.content)

                logger.info(f"音频已保存到: {output_file}")

                # 后处理：删除开头静音
                trim_result = self.trim_leading_silence(output_file)
                if not trim_result["success"]:
                    logger.warning(f"静音处理失败: {trim_result.get('error')}")
                    # 静音处理失败不影响整体流程，继续执行

                # 如果需要调整语速
                if speed != 1.0:
                    logger.info(f"开始调整语速: {speed}x")
                    speed_result = self.adjust_speed(output_file, speed)
                    if not speed_result["success"]:
                        logger.error(f"语速调整失败: {speed_result.get('error')}")
                        return {
                            "success": False,
                            "error": f"音频生成成功但语速调整失败: {speed_result.get('error')}"
                        }
                    logger.info(f"语速调整完成: {speed}x")

                return {"success": True, "output": str(output_file)}
            else:
                error_msg = f"TTS 请求失败 (HTTP {response.status_code})"
                try:
                    error_detail = response.json()
                    error_msg += f": {error_detail}"
                except Exception:
                    error_msg += f": {response.text[:200]}"

                logger.error(error_msg)
                return {"success": False, "error": error_msg}

        except requests.exceptions.Timeout:
            error_msg = "TTS 请求超时"
            logger.error(error_msg)
            return {"success": False, "error": error_msg}

        except requests.exceptions.ConnectionError:
            error_msg = f"无法连接到 TTS 服务器: {server_url}"
            logger.error(error_msg)
            return {"success": False, "error": error_msg}

        except Exception as e:
            error_msg = f"TTS 生成失败: {str(e)}"
            logger.exception(error_msg)
            return {"success": False, "error": error_msg}
