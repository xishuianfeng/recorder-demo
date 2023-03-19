import { useEffect, useRef, useState } from "react"
import { createFFmpeg } from "@ffmpeg/ffmpeg"
import "./App.scss"

interface DeviceListProps {
  devices: MediaDeviceInfo | MediaDeviceInfo[]
  selectedId?: string
  onClick?: (device: MediaDeviceInfo) => void
}
const DeviceList = (props: DeviceListProps) => {
  const { devices, onClick, selectedId } = props
  const deviceList = Array.isArray(devices) ? devices : [devices]
  return (
    <>
      {deviceList.map((device) => {
        const { deviceId, groupId, kind, label } = device
        return (
          <div
            className={[
              "device-info",
              selectedId === deviceId ? "selected" : undefined,
            ]
              .filter(Boolean)
              .join(" ")}
            key={deviceId}
            onClick={() => onClick?.(device)}
          >
            <div className="device-id">deviceId: {deviceId}</div>
            <div className="device-group-id">groupId: {groupId}</div>
            <div className="device-kind">kind: {kind}</div>
            <div className="device-label">label: {label}</div>
          </div>
        )
      })}
    </>
  )
}

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

function App() {
  const videoRef = useRef<HTMLVideoElement>(null!)
  const recorderRef = useRef<MediaRecorder>(null!)
  const blobs = useRef<Array<Blob>>([])

  const onStart = () => {
    window.navigator.mediaDevices.getDisplayMedia().then((stream) => {
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

  const onEnd = () => {
    const stream = videoRef.current.srcObject as MediaStream
    stream.getTracks().forEach((track) => {
      track.stop()
    })
    recorderRef.current.stop()
  }

  // 转换成 mp4 格式的 blob
  const transformedBlob = useRef<Blob>(null!)
  const onTransform = async () => {
    // const videoBlob = new Blob(blobs.current)
    // const mp4Blob = await transformWebm(videoBlob)
    // console.log("完成！！")
    // transformedBlob.current = mp4Blob
  }

  const onDownload = () => {
    // const videoBlob = transformedBlob.current
    const videoBlob = new Blob(blobs.current, { type: "video/webm" })
    const url = URL.createObjectURL(videoBlob)
    const link = document.createElement("a")
    link.href = url
    // link.download = "test.mp4"
    link.download = "test.webm"
    document.body.appendChild(link)
    link.style.display = "none"
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    blobs.current = []
  }

  const [deviceId, setDeviceId] = useState<{ audio: string; video: string }>({
    audio: "",
    video: "",
  })
  const onCameraClick = () => {
    const constraints: MediaStreamConstraints = {}
    if (deviceId.video) {
      constraints.video = {
        deviceId: deviceId.video,
      }
    }
    if (deviceId.audio) {
      constraints.audio = {
        deviceId: deviceId.audio,
      }
    }

    window.navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        console.log("stream =>", stream)
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

  const [deviceList, setDeviceList] = useState<{
    audioInput: MediaDeviceInfo[]
    audioOutput: MediaDeviceInfo[]
    videoInput: MediaDeviceInfo[]
  }>({
    audioInput: [],
    audioOutput: [],
    videoInput: [],
  })

  useEffect(() => {
    const onDeviceChange = () => {
      window.navigator.mediaDevices.enumerateDevices().then((devices) => {
        const audioInputDevices = devices.filter(
          (device) => device.kind === "audioinput",
        )
        const audioOutputDevices = devices.filter(
          (device) => device.kind === "audiooutput",
        )
        const videoInputDevices = devices.filter(
          (device) => device.kind === "videoinput",
        )
        setDeviceList({
          audioInput: audioInputDevices,
          audioOutput: audioOutputDevices,
          videoInput: videoInputDevices,
        })
      })
    }
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

  return (
    <div className="App">
      <div className="buttons">
        <button onClick={onCameraClick}>请求用户媒体</button>
        <button onClick={onStart}>开始录制</button>
        <button onClick={onEnd}>结束录制</button>
        <button onClick={onTransform}>转换格式</button>
        <button onClick={onDownload}>下载</button>
      </div>

      <div className="video-container">
        <video ref={videoRef} autoPlay></video>
      </div>

      <div className="devices">
        <div className="audio-input">
          录音设备:
          <DeviceList
            selectedId={deviceId.audio}
            devices={deviceList.audioInput}
            onClick={(deviceInfo) => {
              setDeviceId((deviceId) => {
                return {
                  ...deviceId,
                  audio: deviceInfo.deviceId,
                }
              })
            }}
          ></DeviceList>
        </div>

        <div className="video-input">
          摄像头：
          <DeviceList
            selectedId={deviceId.video}
            devices={deviceList.videoInput}
            onClick={(deviceInfo) => {
              setDeviceId((deviceId) => {
                return {
                  ...deviceId,
                  video: deviceInfo.deviceId,
                }
              })
            }}
          ></DeviceList>
        </div>
      </div>
    </div>
  )
}

export default App