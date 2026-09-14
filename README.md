# PIVA B3 Pro Control

Web controller for **PIVA / BornforEsports B3 Pro** 25W magnetic phone cooler.

Repo: https://github.com/thaibao-byte/piva-b3pro-control

## What works now
- Control UI (`index.html`): power, 4 cooling levels, fan speed, RGB
- Demo / simulation mode (no hardware required)
- Web Bluetooth scan + GATT service listing on Chrome

## What is blocked
The official Android app on Drive (`Piva-1.7.3 (1)_1.apk`, ~143 MB) cannot be downloaded through the Drive connector (128 MB limit).
Official BLE UUID / command bytes are therefore **not extracted yet**. Live control writes a JSON packet only after a writable characteristic is known.

## Product data (public + Drive image)
| Field | Value |
|---|---|
| Brand marks | PIVA, BORNEFORESPORTS B3PRO |
| Power | 25W semiconductor |
| Fan | 7-blade, up to ~5454 RPM |
| Weight | ~80 g |
| Mount | magnetic + clip + steel sheet |
| Lighting | RGB ring |
| App modes (family B21/B3) | Silent, Balance, Overclock, AI |

## Run locally
Open `index.html` in Chrome. Web Bluetooth needs HTTPS or `localhost`.

## Next
Upload a split APK / `classes.dex` under 128 MB to extract real BLE frames.
