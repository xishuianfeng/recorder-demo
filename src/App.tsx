import { createFFmpeg } from "@ffmpeg/ffmpeg"
import { useRef } from "react"
import './App.scss'

const ffmpeg = createFFmpeg()
ffmpeg.load().then(()=>{
  console.log('加载完成');
})

function App() {
  const videoRef = useRef<HTMLVideoElement>(null!)
  const recorderRef = useRef<MediaRecorder>(null!)
  //blob
  const blobs = useRef<Array<Blob>>([])

  const onStart = () => {
    window.navigator.mediaDevices.getDisplayMedia().then((stream) => {
      videoRef.current.srcObject = stream
      const recorder = new MediaRecorder(stream)
      recorderRef.current = recorder

      const dataAvailAbleListerner = (event: BlobEvent) => {
        blobs.current.push(event.data)
      }
      recorder.addEventListener('dataavailable', dataAvailAbleListerner)
      recorder.start()
    })
  }

  const onEnd = () => {
    const stream = videoRef.current.srcObject as MediaStream
    stream.getVideoTracks().forEach((track) => {
      track.stop()
    })
    recorderRef.current.stop()
  }

  const onTransfrom = () => {

  }

  const onDownload = ()=> {
    const videoBlob = new Blob(blobs.current, {
      type: 'video/webm'
    })
    const url = URL.createObjectURL(videoBlob)

    //下载视频
    const link = document.createElement('a')
    link.href = url
    link.download = 'test.webm'
    document.body.appendChild(link)
    link.style.display = 'none'
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    blobs.current = []
  }

  return (
    <div className="App" style={{ margin: 100 }}>
      <button onClick={onStart}>开始录制</button>
      <button onClick={onEnd}>结束录制</button>
      <button onClick={onTransfrom}>转换格式</button>
      <button onClick={onDownload}>下载</button>
      <video ref={videoRef} autoPlay></video>
    </div>
  )
}

export default App
