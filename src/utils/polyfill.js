// 在你的入口文件中引入

function detectDevice() {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera

  if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
    return 'iOS'
  }

  if (/android/i.test(userAgent)) {
    return 'Android'
  }

  return 'unknown'
}

const deviceType = detectDevice()
if (deviceType === 'iOS' || deviceType === 'Android') {
  // eslint-disable-next-line node/prefer-global/process
  window.process = {
    env: {
      NODE_ENV: 'development',
    },
  }
}
