# 第三方來源與公開範圍

本倉庫的 MIT 授權只涵蓋自行撰寫的 Samsung 適配層、建置工具、測試與文件。外部下載的應用、素材及程式保留各自的權利與授權條件。

## 紅果電視上游應用

來源：[aston314/hongguo-tv-releases](https://github.com/aston314/hongguo-tv-releases)。本機建置使用固定的 0.2.117 介面與 0.2.127 服務 IPK；具體下載位址與校驗值由建置設定記錄。服務來源版本為 [webos-v0.2.127-test.25](https://github.com/aston314/hongguo-tv-releases/releases/tag/webos-v0.2.127-test.25)。

2026-10-29 查核時，該公開倉庫提供安裝包及版本資訊，未找到涵蓋整個應用的授權檔；README 提及私有原始碼倉庫。IPK 內的 `third-party-licenses.txt` 包含第三方依賴的 MIT 聲明，不能據此將整個應用視為 MIT 授權。

因此，本倉庫不附上上游 IPK、壓縮後的介面／服務程式、圖示等素材，也不發布含這些內容的完整 WGT。工具在使用者本機下載固定版本，再套用 Samsung 適配。這項安排本身不替上游程式新增授權。

## 備用地址解析輔助程式

先前本機移植版的 `fallback-model.js` 參考了 [qq294716498/HongguoTV-Phone-TV-NoAds 的播放取源程式](https://github.com/qq294716498/HongguoTV-Phone-TV-NoAds/blob/main/native/core/provider_hongguo_native_media.go)。早期本機註記將它標為 GPL-3.0；重新查核後，未找到支持此標記的明確應用授權或檔頭聲明，故不能沿用該假設。

該專案 README 提及的 GPL 媒體依賴，不等於其所有自有程式都已採 GPL。其參考來源 Xanerix/guoapp 雖有 GPL-3.0 授權，查到的對應版本也沒有這段備用地址處理，不能據此推定新程式的授權。

本公開倉庫因此不包含該輔助程式，也不將其內容藏入補丁。`--fallback-helper` 僅供使用者自行提供有權使用的相容檔案；預設建置不包含這項能力。未隨附的檔案不受本倉庫 MIT 授權涵蓋。

## Samsung 平台

適配程式呼叫電視韌體提供的 Samsung Web API；Samsung SDK／平台程式不隨本倉庫散布。

- [AVPlay 使用說明](https://developer.samsung.com/smarttv/develop/guides/multimedia/media-playback/using-avplay.html)
- [AVPlay API](https://developer.samsung.com/smarttv/develop/api-references/samsung-product-api-references/avplay-api.html)

## 不包含的資料

倉庫不應包含電視／帳號身分、Cookie、登入回應、觀看紀錄、影片、私人區網位址、Samsung 憑證或私鑰。安裝範例中的位址與路徑均為範例。

GitHub 對公開倉庫與授權範圍的說明可參考 [Licensing a repository](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository)。
