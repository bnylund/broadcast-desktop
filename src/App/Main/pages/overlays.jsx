/**
 *
 *  This page will list out currently active overlays running on the local machine.
 *  Additionally, later on we will add a list of overlays that a user can download
 *  and use for their streams. This needs a websocket server on the electron backend,
 *  which the frontend will need to query to connect the overlays to servers.
 *
 * @param {*} props List of props
 * @returns Overlays page
 */
import moment from 'moment'
import { useState, useEffect } from 'react'
import Modal from 'react-modal'
import { useRefresh } from '../../../hooks/refresh'
import './overlays.scss'

export const Overlays = (props) => {
  const [open, setOpen] = useState(false)
  const [overlays, setOverlays] = useState([])
  const [servers, setServers] = useState([])
  const [overlayId, setOverlayId] = useState(null)
  Modal.setAppElement('#main-app')

  useRefresh(() => {
    window.api
      .getOverlays()
      .then((val) => {
        setOverlays(val)
      })
      .catch((err) => {
        //console.log('failed to fetch overlays', err)
      })
    window.api
      .getServers()
      .then((val) => {
        setServers(val)
      })
      .catch((err) => {
        //console.log('failed to fetch servers', err)
      })
  }, 250)

  const overlay = overlays.find((x) => x.id === overlayId)

  return (
    <div className="overlays">
      <table>
        <thead>
          <tr>
            <td>OBS Browser Version</td>
            <td>Status</td>
            <td>Uptime</td>
            <td></td>
          </tr>
        </thead>
        <tbody>
          {overlays.map((val, index) => {
            return (
              <tr
                onClick={() => {
                  setOverlayId(val.id)
                  setOpen(true)
                }}
                key={`overlay-${val.id}-${val.status}-${val.obsBrowserVersion}-${servers.length}`}
              >
                <td>{val.obsBrowserVersion}</td>
                <td>{val.status}</td>
                <td>{moment(val.launch).fromNow(true)}</td>
                <td>
                  {servers.length > 0 ? (
                    <button
                      style={{ padding: '5px' }}
                      onClick={() => {
                        window.api.connectOverlay(
                          val.id,
                          `http://localhost:${servers[0].port}`,
                        )
                      }}
                    >
                      Quick Connect
                    </button>
                  ) : null}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <Modal
        isOpen={open}
        onAfterOpen={() => {
          console.log(overlayId)
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
        <p>{JSON.stringify(overlay, undefined, 2)}</p>
      </Modal>
    </div>
  )
}
