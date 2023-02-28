import { createFFmpeg } from "@ffmpeg/ffmpeg"
import { useRef } from "react"
import './App.scss'

const ffmpeg = createFFmpeg()
ffmpeg.load().then(() => {
  console.log("加载完成")
})

const transformWebm = async (blob:Blob) => {
  return blob
    .arrayBuffer()
    .then((buffer)=>{
      const arrayBuffer = new Uint8Array(buffer)
      //我们有ArrayBuffer   需要Uint8Array
      console.log("开始转换");     
      ffmpeg.FS('writeFile',"test.webm",arrayBuffer)
      return ffmpeg.run("-i","test.webm","output.mp4")
    })
    .then(()=>{
      console.log("转换完成");      
      const array = ffmpeg.FS("readFile","output.mp4")
      return new Blob([array])
    })
}

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

  const transformedBlob = useRef<Blob>(null!)
  const onTransfrom = async () => {
    //转换格式 webm 变成 mp4
    const videoBlob = new Blob(blobs.current)
    const mp4Blob = await transformWebm(videoBlob)
    transformedBlob.current = mp4Blob
  }

  const onDownload = ()=> {
    const videoBlob = transformedBlob.current
    const url = URL.createObjectURL(videoBlob)

    //下载视频
    const link = document.createElement('a')
    link.href = url
    link.download = 'test.mp4'
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
      <button onClick={onTransfrom}>转换成MP4格式</button>
      <button onClick={onDownload}>下载MP4视频文件</button>
      <video ref={videoRef} autoPlay></video>
    </div>
  )
}

export default App
