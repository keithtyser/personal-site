---
title: Tech Stack & Setup
description: Hardware and home-lab setup.
updated: 2026-07-13
toc: false
---

## Hardware

### Peripherals

- **Keyboard**: Royal Kludge M75
- **Mice**: Logitech G Pro X Superlight 2, Logitech MX Master 3s
- **Monitor**: MSI MAG 341C OLED
- **Earbuds**: wired Apple EarPods

### Main PC

- Windows 11 Pro
- AMD Ryzen 9 9950X3D (16-core)
- 96 GB RAM
- 4 TB SSD
- Sapphire Nitro+ AMD Radeon RX 9070 XT (16 GB GDDR6, RDNA 4)

## Home Lab

### 2x DGX Spark cluster

- NVIDIA [DGX Spark](https://www.nvidia.com/en-us/products/workstations/dgx-spark/) + [ASUS Ascent GX10](https://www.asus.com/us/networking-iot-servers/desktop-ai-supercomputer/ultra-small-ai-supercomputers/asus-ascent-gx10/), clustered over a QSFP cable between their ConnectX-7 NICs
- Each node: GB10 Grace Blackwell Superchip, 1 petaFLOP of AI performance at FP4, 128 GB coherent unified memory
- 256 GB unified memory across the cluster; enough to serve models up to ~405B parameters

### 2x NVIDIA RTX PRO 6000 Blackwell Max-Q Workstation Edition

- 96 GB GDDR7 ECC each (192 GB total VRAM)
- Going into the AI workstation build below; assembly this week (Jul 2026)

### AI Workstation (coming online)

All parts are in. Assembling this week:

- AMD Ryzen Threadripper PRO 9965WX
- ASUS Pro WS WRX90E-SAGE SE
- 192 GB DDR5 (8x 24 GB)
- 2200W PSU
- Phanteks Enthoo Pro 2 Server Edition case
- NVMe, obviously
- Dual RTX PRO 6000 Blackwell Max-Q (see above)


### ATOMMAN X7 Ti

- Intel Core Ultra 9 185H
- 64 GB RAM
- 2 TB SSD
- Proxmox host. One VM runs OpenClaw, the other handles deployments.
