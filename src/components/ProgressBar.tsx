import './ProgressBar.scss'

interface ProgressProps {
  percent: number
  height: number
}

export const ProgressBar = (props: ProgressProps) => {
  return (
    <div>
      <div className="Progress-progress">
        <div className="Progress-progress__inner">
          <div
            style={{
              width: props.percent * 100 + '%',
            }}
            className="Progress-progress__bg"
          />
        </div>
      </div>
    </div>
  )
}
