import { useEffect, useRef, useState } from "react"
import { CheckboxGroupProps } from "antd/es/checkbox"
import { SelectProps, message, Checkbox, Modal, Select } from "antd"
import { downloadBlob } from "../../utils/download"
import ffmpegUtil from "@/utils/ffmpeg"

// const ffmpeg = createFFmpeg()
// ffmpeg.load().then(() => {
//   console.log("加载完成")
// })

// const transformWebm = async (blob: Blob) => {
//   return blob
//     .arrayBuffer()
//     .then((buffer) => {
//       const arrayBuffer = new Uint8Array(buffer, 0, buffer.byteLength)
//       // 我们有的：ArrayBuffer 需要的：Uint8Array
//       ffmpeg.FS("writeFile", "test.webm", arrayBuffer)
//       console.log("开始转换")
//       return ffmpeg.run("-i", "test.webm", "output.mp4")
//     })
//     .then(() => {
//       console.log("转换完成")
//       const array = ffmpeg.FS("readFile", "output.mp4")
//       return new Blob([array])
//     })
// }

export const Component = () => {
  const videoRef = useRef<HTMLVideoElement>(null!)
  const recorderRef = useRef<MediaRecorder>(null!)
  const blobs = useRef<Array<Blob>>([])

  const [deviceList, setDeviceList] = useState<{
    audioInput: MediaDeviceInfo[]
    videoInput: MediaDeviceInfo[]
  }>({
    audioInput: [],
    videoInput: [],
  })

  const [isGetUserMediaModalOpen, setIsGetUserMediaModalOpen] = useState(false)
  const [isSelectResolutionOpen, setIsSelectResolutionOpen] = useState(false)
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false)
  const [isConfirmButtonLoading, setIsConfirmButtonLoading] = useState(false)
  const [selectedVideoFormat, setSelectedVideoFormat] =
  useState<SupportedExtensionNames>("mp4")

  const onStart = () => {

    setIsSelectResolutionOpen(false)
    window.navigator.mediaDevices.getDisplayMedia(constraints).then((stream) => {
      videoRef.current.srcObject = stream
      const recorder = new MediaRecorder(stream)
      recorderRef.current = recorder
      // data available
      const dataAvailableListener = (event: BlobEvent) => {
        blobs.current.push(event.data)
      }
      recorder.addEventListener("dataavailable", dataAvailableListener)
      recorder.start()
    })
  }

  const onSelectResolution = () => {
    setIsSelectResolutionOpen(true)
  }

  const onEnd = () => {
    const stream = videoRef.current.srcObject as MediaStream
    stream.getTracks().forEach((track) => {
      track.stop()
    })
    recorderRef.current.stop()
  }
  
  const onDownload = () => {
    setIsDownloadModalOpen(true)
  }

  const onConfirmDownload = async () => {
    setIsConfirmButtonLoading(true)
    // 1. 转换 blob 的格式
    const videoBlob = new Blob(blobs.current)
    const outputFilename = `output.${selectedVideoFormat}`
    try {
      await ffmpegUtil.init()
      const transformedBlob = await ffmpegUtil.transformVideoFormat(videoBlob, {
        inputFilename: "test.webm",
        outputFilename,
      })

      // 2. 下载 blob
      downloadBlob(transformedBlob, {
        extensionName: selectedVideoFormat,
        filename: outputFilename,
      })
    } catch (error) {
      console.log(`视频下载失败`, error)
    } finally {
      setIsConfirmButtonLoading(false)
    }
  }

  const createOptions = (devices: MediaDeviceInfo[]) => {
    return devices.map((device) => {
      return {
        label: device.label,
        value: device.deviceId,
      }
    })
  }

  const audioOptions: SelectProps["options"] = createOptions(deviceList.audioInput)
  const videoOptions: SelectProps["options"] = createOptions(deviceList.videoInput)
  const resolutionOptions: SelectProps["options"] = [
    { value: '600x360', label: '360p' },
    { value: '720x480', label: '480p' },
    { value: '1280x720', label: '720p' },
    { value: '1920x1080', label: '1080p' },
    { value: '2560x1440', label: '2k' },
    { value: '4096x2160', label: '4k' },
  ]
  const videoFormatOptions: SelectProps["options"] = [
    {
      label: "mp4",
      value: "mp4",
    },
    {
      label: "flv",
      value: "flv",
    },
    {
      label: "mkv",
      value: "mkv",
    },
    {
      label: "avi",
      value: "avi",
    },
  ]

  const [deviceId, setDeviceId] = useState<{ audio: string; video: string }>({
    audio: "",
    video: "",
  })

  const [videoResolution, setVideoResolution] = useState<{
    width: number, height: number
  }>({
    width: 0,
    height: 0
  })
  const constraints: MediaStreamConstraints = {
    video: {},
    audio: {}
  }
  constraints.video = videoResolution

  const filterValidDevices = (device: MediaDeviceInfo[]) => {
    return device.filter((device) => device.deviceId && device.groupId)
  }

  const onCameraClick = () => {
    window.navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        const audioInputDeviceNumber = filterValidDevices(deviceList.audioInput).length
        const videoInputDeviceNumber = filterValidDevices(deviceList.videoInput).length

        if (audioInputDeviceNumber === 0 || videoInputDeviceNumber === 0) {
          onDeviceChange()
        }
        stream.getTracks().forEach((track) => {
          track.stop();
        });
        setIsGetUserMediaModalOpen(true)
      })
      .catch((error) => {
        alert('没有权限莫，怎么获取呢')
      })
    return
  }

  //开始录屏
  const onStartRecord = () => {
    constraints.audio = { deviceId: deviceId.audio }
    constraints.video = { deviceId: deviceId.video }
    if (videoResolution.width !== 0 && videoResolution.height !== 0) {
      constraints.video = videoResolution
    }
    setIsGetUserMediaModalOpen(false)

    window.navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        videoRef.current.srcObject = stream
        const recorder = new MediaRecorder(stream)
        recorderRef.current = recorder
        blobs.current = []
        const dataAvailableListener = (event: BlobEvent) => {
          blobs.current.push(event.data)
        }
        recorder.addEventListener("dataavailable", dataAvailableListener)
        recorder.start()
      })
      .catch((error) => {
        console.log(`请求用户媒体失败, error: ${error}`)
      })
  }

  const onDeviceChange = () => {
    window.navigator.mediaDevices.enumerateDevices().then((devices) => {
      const audioInputDevices = devices.filter(
        (device) => device.kind === "audioinput",
      )
      const videoInputDevices = devices.filter(
        (device) => device.kind === "videoinput",
      )
      setDeviceList({
        audioInput: audioInputDevices,
        videoInput: videoInputDevices,
      })
    })
  }

  useEffect(() => {
    onDeviceChange()
    window.navigator.mediaDevices.addEventListener(
      "devicechange",
      onDeviceChange,
    )

    return () => {
      window.navigator.mediaDevices.removeEventListener(
        "devicechange",
        onDeviceChange,
      )
    }
  }, [])

  const startRecordButtonDisabled = !deviceId.audio || !deviceId.video
  const startButtonDisabled = (videoResolution.width === 0) && (videoResolution.height === 0)

  return (
    <div className="App">
      <div className="buttons">
        <button onClick={onCameraClick}>请求用户媒体</button>
        <button onClick={onSelectResolution}>选择分辨率</button>
        <button onClick={onEnd}>结束录制</button>
        <button onClick={onDownload}>下载</button>
      </div>
      <div className="video-container">
        <video ref={videoRef} autoPlay></video>
      </div>

      <div>
        <Modal
          open={isSelectResolutionOpen}
          okText="开始录制"
          cancelText="取消"
          closable={false}
          onOk={onStart}
          onCancel={() => {
            setIsSelectResolutionOpen(false)
          }}
          okButtonProps={{ disabled: startButtonDisabled }}
        >
          <div>
            选择分辨率：
            <Select style={{ width: '100%' }}
              defaultValue={videoResolution}
              onChange={(value) => {
                const width = value.toString().split('x')[0]
                const height = value.toString().split('x')[1]
                setVideoResolution({
                  width: parseInt(width), height: parseInt(height)
                })
              }}
              options={resolutionOptions}></Select>
          </div>
        </Modal>
      </div>

      <div>
        <Modal
          open={isGetUserMediaModalOpen}
          okText="开始录屏"
          cancelText="取消"
          closable={false}
          onOk={onStartRecord}
          onCancel={() => {
            setIsGetUserMediaModalOpen(false)
          }}
          okButtonProps={{ disabled: startRecordButtonDisabled }}
        >
          <div>
            选择音频设备：
            <Select style={{ width: '100%' }}
              value={deviceId.audio}
              onChange={(value) => {
                setDeviceId((deviceIds) => {
                  return {
                    ...deviceIds,
                    audio: value
                  }
                })
              }}
              options={audioOptions}></Select>
          </div>
          <div className="video-device-select">
            选择视频设备：
            <Select style={{ width: '100%' }}
              value={deviceId.video}
              onChange={(value) => {
                setDeviceId((deviceIds) => {
                  return {
                    ...deviceIds,
                    video: value
                  }
                })
              }}
              options={videoOptions}></Select>
          </div>
        </Modal>
        <Modal
          open={isDownloadModalOpen}
          okText="下载"
          cancelText="取消"
          closable={false}
          onOk={onConfirmDownload}
          onCancel={() => {
            setIsDownloadModalOpen(false)
          }}
          okButtonProps={{ loading: isConfirmButtonLoading }}
        >
          <div>
            选择下载视频的格式：
            <Select
              style={{ width: "100%" }}
              value={selectedVideoFormat}
              onChange={(value) => {
                setSelectedVideoFormat(value)
              }}
              options={videoFormatOptions}
            />
          </div>
        </Modal>
      </div>
    </div>
  )
}