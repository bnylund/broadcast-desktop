/**
 *
 * The "Servers" page will be responsible for managing any relays running on the user's computer.
 * It will display details for each relay (uptime, launch time, connections, port, etc), and
 * will provide actions to launch/stop relays.
 *
 * @param {*} props
 * @returns Page containing the list of servers
 */
import { useEffect, useState } from 'react'
import './servers.scss'

export const Servers = (props) => {
  const [servers, setServers] = useState([])
  const [refresh, setRefresh] = useState(false)

  useEffect(() => {
    window.api
      .getServers()
      .then((val) => {
        setServers(val)
        console.log('got servers', val)
      })
      .catch((err) => {
        console.log('failed to fetch servers', err)
      })
  }, [refresh])

  useEffect(() => {
    function serverStatusEvent(_, server) {
      console.log('status update: ', server)
      window.api
        .getServers()
        .then((val) => {
          setServers(val)
        })
        .catch((err) => {
          console.log('failed to fetch servers', err)
        })
    }
    window.api.onServerStatus(serverStatusEvent)

    return () => {
      window.api.offServerStatus(serverStatusEvent)
    }
  }, [true])

  return (
    <div className="servers">
      <button
        className="btnPrimary"
        style={{ alignSelf: 'end' }}
        onClick={() => {
          console.log('Launching server')
          window.api
            .spawnServer()
            .then((val) => {
              console.log(val)
            })
            .catch((err) => {
              console.log('error launching server', err)
            })
        }}
      >
        + Launch Server
      </button>
      <table>
        <thead>
          <tr>
            <td>PID</td>
            <td>Endpoint</td>
            <td>Uptime</td>
            <td>Connections</td>
            <td></td>
          </tr>
        </thead>
        <tbody>
          {servers.map((val) => {
            return (
              <tr key={`serv-${val.pid}`}>
                <td>{val.pid}</td>
                <td>localhost:{val.port}</td>
                <td>0 seconds</td>
                <td>0</td>
                <td></td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <button
        onClick={() => {
          setRefresh(!refresh)
        }}
      >
        Refresh
      </button>
    </div>
  )
}
