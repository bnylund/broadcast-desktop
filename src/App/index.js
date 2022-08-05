import { useEffect, useState } from 'react'
import { Main } from './Main'
import logo from '../assets/logo.png'
import ben from '../assets/ben.jpg'
import './index.scss'

// Eventually we will need to check for login, but to get a working version out
// we will disregard auth
function App() {
  const [openMenu, setOpenMenu] = useState(null)
  const [page, setPage] = useState(null) // "Login" and "Main"
  const [version, setVersion] = useState(null)

  useEffect(() => {
    function closeMenuHandler(ev) {
      if (openMenu !== null) setOpenMenu(null)
    }

    window.addEventListener('click', closeMenuHandler)
    window.versions.app().then((val) => setVersion(val))

    return () => {
      window.removeEventListener('click', closeMenuHandler)
    }
  })

  return (
    <div>
      <div className="navbar">
        <img src={logo} height="18" alt="Nylund Development" />
        <div className="toolbar">
          <p
            onClick={(evt) => {
              setOpenMenu(openMenu === 'file' ? null : 'file')
              evt.stopPropagation()
            }}
            onMouseEnter={() => {
              if (openMenu !== null) setOpenMenu('file')
            }}
            data-open={openMenu === 'file' ? 'true' : 'false'}
          >
            File
          </p>
          <p
            onClick={(evt) => {
              setOpenMenu(openMenu === 'help' ? null : 'help')
              evt.stopPropagation()
            }}
            onMouseEnter={() => {
              if (openMenu !== null) setOpenMenu('help')
            }}
            data-open={openMenu === 'help' ? 'true' : 'false'}
          >
            Help
          </p>
        </div>
      </div>
      <div className="content">
        {page === null || page === 'main' ? <Main /> : null}
        {/*<div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {' '}
          <img
            width="150"
            src={logo}
            alt="Nylund Development"
            style={{ filter: 'drop-shadow(1px 1px 5px #111a)' }}
          />{' '}
          </div>*/}
      </div>

      {/* Popups for toolbar, etc */}
      <>
        {openMenu === 'file' ? (
          <div
            className="toolbarMenu"
            style={{ top: '32px', left: '57px' }}
            onClick={(evt) => {
              evt.stopPropagation()
            }}
          >
            <p>This is in the FILE menu</p>
          </div>
        ) : null}
        {openMenu === 'help' ? (
          <div
            className="toolbarMenu"
            style={{ top: '32px', left: '107px' }}
            onClick={(evt) => {
              evt.stopPropagation()
            }}
          >
            <p
              onClick={() => {
                setOpenMenu('about')
              }}
            >
              About Rocketcast
            </p>
            <hr />
          </div>
        ) : null}
        {openMenu === 'about' ? (
          <div className="fullscreenPopup">
            <div
              onClick={(evt) => {
                evt.stopPropagation()
              }}
            >
              <p style={{ fontSize: '46px' }}>
                Rocketcast
                <span style={{ color: '#3fd294', fontWeight: '600' }}>.io</span>
              </p>
              <p style={{ color: '#aaa' }}>
                Powering Rocket League broadcasts around the world!
              </p>
              <p
                style={{
                  marginTop: '25px',
                  textAlign: 'center',
                  fontSize: '18px',
                }}
              >
                Rocketcast was made to make broadcasting your Rocket League
                matches easier than ever, allowing you to connect with your
                fanbase with a fully-integrated overlay to provide custom
                graphics to your matches. This client was made in an attempt to
                deliver the same features as the cloud-hosted servers on your
                own machine to run overlays at the lowest possible latency.
                Thank you for checking out{' '}
                <span style={{ color: '#3fd294', fontWeight: '600' }}>
                  Rocketcast
                </span>
                !
              </p>
              <div className="aboutFounder">
                <img src={ben} width="100" height="100" />
                <div>
                  <p>Ben Nylund</p>
                  <p>Founder of Rocketcast.io</p>
                  <div>
                    {[
                      {
                        icon: 'fa-brands fa-github',
                        link: 'https://github.com/bnylund',
                      },
                      {
                        icon: 'fa-brands fa-linkedin',
                        link: 'https://www.linkedin.com/in/ben-nylund-9009291a1',
                      },
                      {
                        icon: 'fa-brands fa-twitter',
                        link: 'https://twitter.com/benjaminnylund',
                      },
                    ].map((val) => {
                      return (
                        <i
                          key={`about-icons-${val.icon}`}
                          className={val.icon}
                          onClick={() => {
                            window.open(val.link)
                          }}
                        ></i>
                      )
                    })}
                  </div>
                </div>
              </div>
              {version === null ? null : (
                <p
                  style={{ color: '#999', fontSize: '14px', marginTop: '20px' }}
                >
                  Rocketcast.io v{version}
                </p>
              )}
              <p style={{ color: '#999', fontSize: '14px', marginTop: '5px' }}>
                Chrome v{window.versions.chrome()}, Node v
                {window.versions.node()}, Electron v{window.versions.electron()}
              </p>
            </div>
          </div>
        ) : null}
      </>
    </div>
  )
}

export default App
