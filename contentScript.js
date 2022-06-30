if(window.location.href.toString().split(".")[0].endsWith("nexonport"))
{
    let s = document.createElement('script');
    s.src = chrome.runtime.getURL('nexonHackCtrl.js');
    (document.head || document.documentElement).appendChild(s);
}