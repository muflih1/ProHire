export function goForceFullPageRedirectTo(url: string | URL, useReplace = false) {
  if (useReplace) {
    window.location.replace(url.toString())
  } else {
    window.location = url.toString() as any
  }
}