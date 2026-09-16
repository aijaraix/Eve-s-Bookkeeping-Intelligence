# OCR Runtime Current State

Observed: 2026-09-16 UTC

This file records the currently provisioned local OCR runtime independently from application release state.

## Internal services

- `eve-ocr-paddle:8765` — ClusterIP only
- `eve-ocr-doctr:8765` — ClusterIP only

No public ingress is configured.

## Current images

- `docker.io/library/eve-ocr-paddle:p1-005`
- `docker.io/library/eve-ocr-doctr:p1-005`

Both are imported into the current Eve single-node k3s/containerd runtime and use `imagePullPolicy: Never` in the saved runtime manifest.

## Model caches

- `/opt/eve-ocr-models/paddle`
- `/opt/eve-ocr-models/doctr`

Caches survived deployment restart with byte-for-byte size continuity at the verification checkpoint.

## Reachability

Verified from:

- Eve extraction worker
- Eve port-3000 web application pod

Required application runtime values when the feature branch is released:

```text
EVE_OCR_PADDLE_URL=http://eve-ocr-paddle:8765
EVE_OCR_DOCTR_URL=http://eve-ocr-doctr:8765
```

## Release boundary

The services are running now, but active production application code remains on `main`. The application does not use these services until the OCR feature changes are merged/released and the runtime environment values above are applied.

See `2026-09-16_LOCAL_OCR_SOURCE_TO_PIXEL_ACCEPTANCE.md` for complete physical acceptance evidence.
