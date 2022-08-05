/**
 *
 * The "Servers" page will be responsible for managing any relays running on the user's computer.
 * It will display details for each relay (uptime, launch time, connections, port, etc), and
 * will provide actions to launch/stop relays.
 *
 * @param {*} props
 * @returns Page containing the list of servers
 */
import './servers.scss'

export const Servers = (props) => {
  return (
    <div className="servers">
      <button
        className="btnPrimary"
        style={{ alignSelf: 'end' }}
        onClick={() => {
          console.log('Launching server')
          window.api.spawnServer().then((val) => {
            console.log(val)
          })
        }}
      >
        + Launch Server
      </button>
    </div>
  )
}
