/**
 *
 * The "Servers" page will be responsible for managing any relays running on the user's computer.
 * It will display details for each relay (uptime, launch time, connections, port, etc), and
 * will provide actions to launch/stop relays.
 *
 * @param {*} props
 * @returns Page containing the list of servers
 */
import moment from 'moment'
import { useEffect, useState } from 'react'
import Modal from 'react-modal'
import { ServerData } from '../components/server-data'
import { useRefresh } from '../../../hooks/refresh'
import './servers.scss'

export const Servers = (props) => {
  const [servers, setServers] = useState([])
  const [refresh, setRefresh] = useState(false)
  const [dl, setDl] = useState(null)
  const [serverPid, setServerPid] = useState(null)
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState('log') // 'log' or 'data' for now
  Modal.setAppElement('#main-app')

  useRefresh(() => {
    window.api
      .getServers()
      .then((val) => {
        setServers(val)
      })
      .catch((err) => {
        console.log('failed to fetch servers', err)
      })
  }, 250)

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

    function serverDownloadEvent(_, status) {
      setDl(status)
    }

    window.api.onServerStatus(serverStatusEvent)
    window.api.onDownloadStatus(serverDownloadEvent)

    return () => {
      window.api.offServerStatus(serverStatusEvent)
      window.api.offDownloadStatus(serverDownloadEvent)
    }
  }, [true])

  const server = servers.find((x) => x.pid === serverPid)

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
            <td>RAM Usage</td>
            <td></td>
          </tr>
        </thead>
        <tbody>
          {servers.map((val) => {
            if (!val.pid || !val.stats || !val.port) return null
            return (
              <tr
                key={`serv-${val.pid}`}
                onClick={() => {
                  setServerPid(val.pid)
                  setOpen(true)
                }}
              >
                <td>{val.pid}</td>
                <td>localhost:{val.port}</td>
                <td>
                  {val.stats
                    ? moment(val.stats.timestamp - val.stats.elapsed).fromNow(
                        true,
                      )
                    : 'Unknown'}
                </td>
                <td>{formatBytes(val.stats.memory, 0)}</td>
                <td>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                    }}
                  >
                    Actions
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <Modal
        isOpen={open}
        onAfterOpen={() => {
          console.log(server)
        }}
        onRequestClose={() => setOpen(false)}
        style={{
          overlay: {
            backgroundColor: '#1119',
          },
          content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: '#555',
            border: 'none',
            color: 'white',
            minWidth: '800px',
            maxHeight: '95vh',
            overflow: 'auto',
          },
        }}
      >
        {server ? (
          <div className="serverPopup">
            <p>Server Details</p>
            <div className="stats">
              <i className="fa-solid fa-microchip"></i>
              <p>{server.stats.cpu.toFixed(0)}% CPU</p>
              <i className="fa-solid fa-memory"></i>
              <p>{formatBytes(server.stats.memory, 0)} RAM</p>
              <i className="fa-solid fa-ethernet"></i>
              <p>Port {server.port}</p>
              <button
                onClick={() => {
                  setServerPid(null)
                  setOpen(false)
                  window.api
                    .stopServer(server.pid)
                    .then((val) => {
                      console.log('STOP:', val)
                    })
                    .catch((err) => {
                      console.log('stop fail:', err)
                    })
                }}
              >
                Stop Server
              </button>
            </div>
            <div className="log">
              {tab === 'log' ? (
                <>
                  <p>Log service started.</p>
                  {server.log.split('\n').map((val, ind) => {
                    return <p key={`slog-l${ind}-${val}`}>{val}</p>
                  })}
                </>
              ) : (
                <ServerData port={server.port} />
              )}
            </div>
            <div className="logTab">
              <p
                data-open={tab === 'log' ? 'true' : 'false'}
                onClick={() => setTab('log')}
              >
                Server Log
              </p>
              <p
                data-open={tab === 'data' ? 'true' : 'false'}
                onClick={() => setTab('data')}
              >
                Match Data
              </p>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}

// https://stackoverflow.com/a/18650828
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}
