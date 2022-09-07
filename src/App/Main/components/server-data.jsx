import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { useRefresh } from '../../../hooks/refresh'

export const ServerData = (props) => {
  const [socket, setSocket] = useState(null)
  const [data, setData] = useState(null)

  useEffect(() => {
    const sock = io(`http://localhost:${props.port}`, {
      transports: ['websocket'],
    })

    sock.once('connect', () => {
      console.log('connected')
      sock.emit('match:get_all', (matches) => {
        setData(matches[0])
      })
    })

    setSocket(sock)

    return () => {
      console.log('disconnecting')
      sock.close()
    }
  }, [true])

  useRefresh(
    () => {
      if (socket && socket.connected) {
        socket.emit('match:get_all', (matches) => {
          setData(matches[0])
        })
      }
    },
    1000,
    [socket, data],
  )

  return !data ? (
    <p>No match data.</p>
  ) : (
    <>
      {JSON.stringify(data, undefined, 4)
        .split('\n')
        .map((val, index) => {
          return (
            <span
              style={{ whiteSpace: 'pre-wrap' }}
              key={`matchdata-${props.port}-l${index}-${val}`}
            >
              {val}
              <br />
            </span>
          )
        })}
    </>
  )
}
