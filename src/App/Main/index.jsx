import { useState } from 'react'
import { Overlays, Servers } from './pages'
import './main.scss'

function renderPage(page) {
  switch (page) {
    case 'Dashboard':
      return <p>Dashboard</p>
    case 'Overlays':
      return <Overlays />
    case 'Servers':
      return <Servers />
    case 'Games':
      return <p>Games</p>
    default:
      return <p>404 not found</p>
  }
}

export const Main = (props) => {
  const [page, setPage] = useState('Dashboard')

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        height: '100%',
        width: '100%',
      }}
      id="main-app"
    >
      <div className="sidebar">
        <div className="user">
          <p>Welcome, USER</p>
          <p>Not logged in.</p>
        </div>
        <div className="nav">
          {[
            {
              page: 'Dashboard',
              icon: 'fa-solid fa-chart-line',
            },
            {
              page: 'Overlays',
              icon: 'fa-solid fa-display',
            },
            {
              page: 'Servers',
              icon: 'fa-solid fa-server',
            },
            {
              page: 'Games',
              icon: 'fa-solid fa-gamepad',
            },
          ].map((val) => {
            return (
              <p
                data-open={page === val.page ? 'true' : 'false'}
                key={`sidebarnav-${val.page}`}
                onClick={(evt) => {
                  if (page !== val.page) {
                    setPage(val.page)
                  }
                  evt.stopPropagation()
                }}
              >
                <span>
                  <i
                    className={val.icon}
                    style={{ marginLeft: '20px', marginRight: '20px' }}
                  ></i>
                </span>
                {val.page}
              </p>
            )
          })}
        </div>
      </div>
      <div className="mainContent">{renderPage(page)}</div>
    </div>
  )
}
