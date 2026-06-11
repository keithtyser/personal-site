---
title: Running a 2x DGX Spark Cluster at Home
description: What it's actually like to cluster an NVIDIA DGX Spark with an ASUS Ascent GX10 over QSFP, and what 256 GB of unified memory gets you.
date: 2026-06-10
toc: true
---


I sold my M3 Ultra Mac Studio and replaced it with a second DGX Spark. Specifically, the ASUS Ascent GX10, which is the same GB10 Grace Blackwell machine in a different shell at a lower price. The two are now connected back to back with a QSFP cable and run as a single two-node cluster: 256 GB of coherent unified memory, 2 petaFLOPs of FP4 compute, and a 200 Gb/s link between them, all sitting on a shelf drawing less power than a gaming PC.

This post covers why I did it, how the cluster is wired, what actually runs well on it, and the honest disappointments.

## Why I sold the Mac Studio

The M3 Ultra is a genuinely great inference box. 96 GB of unified memory and around 800 GB/s of bandwidth means dense 70B models run at very usable speeds. But my workflow stopped being "chat with a local model" and became post-training: LoRA fine-tunes, quantization runs, eval harnesses, RL experiments. That world is CUDA. MLX is improving fast, but every tool in my pipeline (PyTorch FSDP, TRL, vLLM, TensorRT Model Optimizer, NCCL) treats CUDA as the first-class citizen and everything else as a port.

One ecosystem, two boxes, no translation layer. That was the trade.

## The hardware

Both nodes are the same silicon:

| | DGX Spark / Ascent GX10 (each) |
|---|---|
| Chip | NVIDIA GB10 Grace Blackwell Superchip |
| CPU | 20-core Arm (10x Cortex-X925 + 10x Cortex-A725) |
| GPU | Blackwell, 1 petaFLOP FP4 (sparse) |
| Memory | 128 GB LPDDR5x, coherent unified, ~273 GB/s |
| Networking | ConnectX-7, 2x QSFP ports (200 Gb/s), 10 GbE |
| OS | DGX OS (Ubuntu-based) with the NVIDIA AI stack preinstalled |

The ASUS Ascent GX10 is worth calling out on its own: same GB10, same 128 GB, same ConnectX-7, but it street-prices meaningfully below the NVIDIA-branded Spark. If you are building a two-node cluster, mixing one of each like I did works fine. They are the same machine to the software.

<!-- TODO: photo of the two boxes + QSFP cable -->

## Wiring the cluster

This is the part people assume is hard and is actually the easiest step. The ConnectX-7 NICs face each other directly over a single QSFP cable. No switch, no transceivers, no RDMA tuning marathon.

The rough sequence:

```bash
# On each node: find the ConnectX interface
ip link show

# Give each node a static IP on the point-to-point link
# node 1
sudo ip addr add 10.0.0.1/24 dev enp1s0f0np0
# node 2
sudo ip addr add 10.0.0.2/24 dev enp1s0f0np0

# Sanity check the link
ping 10.0.0.2
ib_write_bw   # should report close to line rate
```

<!-- TODO: paste your actual interface names, MTU settings, and ib_write_bw numbers -->

NCCL picks up the RoCE link with the right environment variables, and from there anything built on torch.distributed or NCCL treats the pair as one world:

```bash
NCCL_IB_HCA=mlx5 NCCL_SOCKET_IFNAME=enp1s0f0np0 \
torchrun --nnodes=2 --nproc-per-node=1 ...
```

<!-- TODO: your actual NCCL env and all-reduce bandwidth test results -->

## What 256 GB actually buys you

The headline: two clustered GB10s can serve models up to roughly 405B parameters at FP4. That is not marketing fiction, it just comes with an asterisk the size of the memory bus.

Here is what I measured on my pair, single stream, rounded to the ballpark:

| Model | Quant | Runtime | Decode tok/s | Prefill tok/s |
|---|---|---|---|---|
| Holo-3.1-35B-A3B | NVFP4 | vLLM | ~80 | ~6,000 |
| gpt-oss-120b | MXFP4 | vLLM | ~75 | ~6,300 |
| Qwen3.5-35B-A3B | FP8 | vLLM | ~55 | ~6,000 |
| gemma-4-26B-A4B | NVFP4 | vLLM | ~45 | ~6,100 |
| Qwen3.5-122B-A10B | INT4 | vLLM | ~40 | ~3,200 |
| Nemotron-3-Super-120B-A12B | NVFP4 | vLLM | mid 20s | ~2,700 |
| Qwen3.5-397B-A17B | INT4 | vLLM | high 20s | ~1,700 |

Read that last row again: a 397B-parameter MoE generating at conversational speed on two shoebox computers in a home office. Five years ago that sentence was science fiction.

The pattern in the table is the whole story: every strong performer is a MoE. Small active-parameter counts work around the 273 GB/s memory bandwidth per node, which is the binding constraint for dense-model inference. A dense 405B at FP4 fits in the combined 256 GB, and it generates at speeds I would call demo-grade, not daily-driver grade. Where the cluster earns its keep is everything else:

- **MoE models.** Active-parameter counts are small, so bandwidth hurts less. Big MoE models at FP4 are the sweet spot for this hardware.
- **Fine-tuning small and mid models.** LoRA on a 30B fits comfortably on one node with room for long sequences. This is most of my Nemotron competition work.
- **Batch evals and data generation.** Throughput-oriented workloads with large batches amortize the bandwidth limit. Two nodes means the eval queue and the experiment queue never fight.
- **Serving while training.** One node serves a quantized model for the agent loop while the other runs fine-tunes. The QSFP link makes moving checkpoints between them instant.

## How it fits my workflow

The cluster is the execution layer for [model-forge](https://github.com/keithtyser/model-forge) and [forgewright](https://github.com/keithtyser/forgewright). Forgewright's specialist agents dispatch jobs over SSH; the Sparks are just GPU targets in its fleet config alongside whatever else I have available. A typical night: one node runs a LoRA sweep for the Nemotron reasoning challenge, the other serves the latest candidate for eval traffic, and I wake up to a ranked report.

<!-- TODO: a paragraph on the experiment queue with concrete throughput, e.g. N fine-tune runs/night -->

## Gotchas

- **DGX OS is opinionated.** It is Ubuntu underneath, but treat it like an appliance. Take the NVIDIA stack updates; do not fight the preinstalled driver matrix.
- **Arm matters occasionally.** The wheels you want mostly exist now (PyTorch, vLLM, flash-attn), but every so often a tool assumes x86 and you end up building from source. Budget an evening here and there.
- **Thermals are fine, placement is not.** The dual-fan design is quiet and effective, but the boxes exhaust enough heat that stacking them touching each other is a bad idea. Give them an inch.
- **The 200 Gb link spoils you.** After working with RDMA between nodes, the 10 GbE uplink to the rest of the LAN feels like a soda straw. Checkpoints to the NAS are now the slow part.

<!-- TODO: anything that actually bit you: firmware updates, NCCL version pinning, etc. -->

## What's next

The Sparks are the always-on, low-power layer. The heavy layer is in progress: a Threadripper PRO 9965WX workstation with 2x RTX PRO 6000 Blackwell Max-Q cards (96 GB GDDR7 each). The Sparks prototype and serve; the workstation will take over the big fine-tunes. Details on that build when the parts stop being on backorder.

If you are considering a Spark cluster: buy it for post-training, evals, MoE inference, and the CUDA ecosystem in a small quiet box. Do not buy it expecting dense-frontier-model chat speeds. It is a lab, not a dragster.

Questions? [@keithtyser](https://twitter.com/keithtyser).
