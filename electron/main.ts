import { app, BrowserWindow } from 'electron'

let mainWindow: BrowserWindow | null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    webPreferences: {
      nodeIntegration: true,
    },
  })

  // 开发阶段
  // if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000')
  // } else {
    // mainWindow.loadFile('index.html')
  // }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})