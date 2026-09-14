# BLE protocol status

Not reverse-engineered yet.

Reason: `Piva-1.7.3 (1)_1.apk` is 142 MiB and exceeds the 128 MiB Google Drive download cap used by this workspace.

`index.html` will:
1. Request a BLE device
2. Connect GATT
3. List primary services
4. Log TX JSON until a writable characteristic UUID is filled in `state.characteristic`

When the APK is split and uploaded, extract Nordic UART-style TX/RX UUIDs and replace the JSON writer with the real byte frames.
