# 紅果電視 Samsung 適配層

將既有紅果電視介面與服務適配至 Samsung Tizen 的原始程式、建置工具及測試。本倉庫公開的是 **Samsung 適配層**，沒有附上完整上游應用、影片、可直接安裝的 WGT 或 Samsung 簽章憑證。

目前只在 Samsung QA65Q70TAWXZW（Q70T／Tizen 5.5）測試。其他 Samsung 型號與 LG 電視尚未由本專案驗證。

## 提供的功能

- Samsung 原生 AVPlay 播放與解碼資源設定。
- 電視本機服務啟動、舊版 Node 相容處理及本機請求適配；正常觀看不需要電腦提供內容服務。
- 保留 Range 邊載入邊播放，完整下載備援快取上限 256 MiB，交接保護 8 秒。
- 遙控器操作、畫面更新與預載調整，以及對應回歸測試。

## 本機建置

需要 Python 3.9 以上、Node.js 20 以上／npm，以及打包、安裝時使用的 PowerShell 7。依賴的上游 IPK 版本與校驗值由建置設定固定：介面來自 0.2.117，服務來自 0.2.127。下載工具會取得這些檔案供本機建置，不會將它們加入本倉庫。

```powershell
python scripts/fetch-upstream.py
npm run build
npm test
pwsh ./scripts/Package.ps1
```

預設建置不包含 `fallback-model.js`。先前本機 0.3.20 使用的備用地址解析輔助程式，其來源授權尚未確認，因此不在公開倉庫散布。若你已自行取得可使用的相容輔助程式，可明確指定：

```powershell
npm run build -- --fallback-helper C:/path/to/fallback-model.js
```

**預設公開建置與本機實測的完整 0.3.20 套件並不完全相同。** 依賴該輔助程式的片源可能無法由預設建置播放；下方電視實測不能直接當成預設建置已通過的證明。

## 安裝到電視

電視需啟用 Samsung Developer Mode，電腦與電視需可互相連線。自行準備 Apps2Samsung 安裝工具，以及可供該電視使用的 Samsung 開發者簽章設定。將下列範例換成自己的電視位址及工具路徑：

```powershell
pwsh ./scripts/Install.ps1 -TvIP 192.168.1.50 -InstallerPath C:/tools/apps2samsung-cli.exe -ProfileDir C:/private/Apps2Samsung-data
```

憑證與私鑰留在自己的電腦。不要提交簽章設定、帳號資料或已簽章安裝包。更新既有安裝時，保留原簽章設定及應用識別，避免先解除安裝而丟失觀看紀錄。

## 已驗證的範圍

以下為使用非公開完整輔助程式的本機 0.3.20，在上述 Q70T 上直接讀取的播放狀態：

- 《nova：新星》第四集完整播放 135.276 秒，接第五集的首次播放進度間隔為 1.651 秒。
- 另一段影片完整播放 179.954 秒，接續 178.863 秒影片的首次進度間隔為 2.045 秒。
- 10 次 ChannelUp／ChannelDown 事件切換後均取得 PLAYING 狀態且錯誤欄為空；9 次取樣已有正播放進度，1 次仍為 0，不能將該次算作已確認持續播放。

按鍵測試由電視瀏覽引擎注入事件；本輪沒有相機或麥克風驗收。整台電視斷電冷開機仍待驗證。這些結果不保證所有片源、網路及機型都能以相同速度播放。

## 授權與來源

本倉庫自行撰寫的適配層、工具及測試採 MIT 授權。上游應用與未隨附的輔助程式不在此授權範圍；公開可下載不代表已取得重新散布整包的授權。詳見 [THIRD_PARTY.md](THIRD_PARTY.md)。
