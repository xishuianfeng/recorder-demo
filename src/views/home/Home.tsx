import { useMemoizedFn } from "ahooks"
import { Button } from "antd/es"
import { useNavigate } from "react-router-dom"

export const Component = () => {
  const navigate = useNavigate()
  const onGotoRecordClick = useMemoizedFn(() => {
    navigate("/recorder")
  })

  return (
    <div>
      <div>首页</div>
      <Button onClick={onGotoRecordClick}>录制视频</Button>
    </div>
  )
}
