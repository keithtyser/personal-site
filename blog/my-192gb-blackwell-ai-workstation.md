---
title: My 192 GB Blackwell AI Workstation
description: Why I moved beyond cloud GPU notebooks and DGX Sparks, what dual RTX PRO 6000 Blackwell cards can do, and the cooling and Linux multi-GPU transfer problems I had to fix.
date: 2026-07-28
toc: true
---

I never feel like I have enough GPUs.

I already own two DGX Sparks. Clustered, they give me 256 GB of unified memory. That lets me test large models that would not fit on one workstation GPU. Their limit is memory bandwidth. Training and inference both run slower than I want, so I use the Sparks to test a job before moving the full run to faster hardware.

That still left me short on compute. I use GPUs almost all the time for Kaggle and my work on large language model (LLM) post-training and evaluation. Most days I run supervised fine-tuning (SFT), low-rank adaptation (LoRA), behavioral cloning, or vLLM inference. I also use proximal policy optimization (PPO) for reinforcement learning. Renting GPUs and working in notebook sessions had become the main limit on my work, so I built this machine.

<figure>
  <img src="/blog/images/blackwell-workstation-open-case.webp" alt="Open side view of my WRX90 workstation with two NVIDIA RTX PRO 6000 Blackwell GPUs, a 420 mm radiator, and six case fans." loading="eager">
  <figcaption>The finished system. The two blower cards run at up to 300 W each.</figcaption>
</figure>

## Why I stopped renting

Kaggle gives me 30 GPU hours each week. I use all 30 sooner than I expect. Those hours are most useful for checking competition submissions inside Kaggle's own environment. Using them for general development leaves less time for the one check I cannot reproduce elsewhere.

Google Colab has many of the same limits. I am still working inside a notebook, and storage is temporary unless I mount Google Drive. I often have to install dependencies again in a new session. Colab works well for short tests, but it does not fit jobs that run for hours and produce checkpoints I want to keep.

I also rented GPUs from Vast.ai quite a bit. It was the best remote option I tried. I could choose the hardware, use the full machine, and pay a fair price.

Then I checked what I had spent. From April 28 through July 24, I paid $1,698.80 for 26 Vast.ai instances. GPU time made up $1,553.26 of that bill, or 91.4%, across 1,153.6 billed hours. Storage cost another $136.41. June alone cost $1,002.30.

Vast.ai worked well, but I was using it often enough that buying a machine made sense for me. Now I have one stable environment and local storage. I can leave a vLLM server running for evals, train on the other card, and debug a package without watching a rental meter.

## The build

| Part | What I used |
|---|---|
| CPU | AMD Ryzen Threadripper PRO 9965WX Shimada Peak, 4.2 GHz, 24 cores / 48 threads |
| GPUs | 2x NVIDIA RTX PRO 6000 Blackwell Max-Q Workstation Edition |
| GPU memory | 96 GB GDDR7 per card, 192 GB aggregate |
| System memory | TEAMGROUP T-Create Master 192 GB DDR5-6000 ECC RDIMM kit, 8x 24 GB |
| Motherboard | ASUS Pro WS WRX90E-SAGE SE |
| Storage | 4 TB WD_BLACK SN8100 NVMe, PCIe 5.0 x4, M.2 2280 |
| Power supply | Thermaltake Toughpower TF3 1650 W |
| Case | Thermaltake AX700TG Super Tower Chassis |
| CPU cooling | Thermaltake AW420 all-in-one (AIO) liquid cooler |
| Thermal paste | Thermal Grizzly Duronaut |
| Case fans | 6x Noctua NF-A14x25 G2 PWM chromax.black, 140 mm |

The important number is 96 GB per GPU. The cards do not share one 192 GB memory pool. A model must be split across both cards to use all 192 GB. For smaller jobs, I can train on one card while the other runs inference or evals.

The Max-Q cards each have a 300 W power limit. That keeps their total power and heat manageable. I still get the 96 GB capacity that made me want these cards.

## What I run on it

The machine has stayed busy since I built it:

- vLLM servers for evaluation and data generation
- supervised fine-tuning and LoRA runs
- behavioral cloning and PPO reinforcement-learning jobs
- Kaggle training, local validation, and model experiments

I now use the DGX Sparks earlier in each project. They are good for testing code, checking memory use, and trying large quantized models across 256 GB. Once I know a run is worth doing, I move it to the workstation.

That split has worked well. The Sparks are small, quiet test machines. The workstation is where I care about iteration speed.

## First benchmark results

I wanted tests that did more than confirm that `nvidia-smi` could see both cards. I checked memory data, transfers between system memory and each GPU, and sustained BF16 matrix multiplication. I tested each card alone and both cards together.

The test system ran Ubuntu 26.04, NVIDIA driver 595.84, and PyTorch 2.11.0 with CUDA 13.0. I capped each GPU at 300 W.

### Memory and PCIe

| Test | GPU 0 | GPU 1 |
|---|---:|---:|
| GPU memory pattern test | 32 GiB, 2 passes, 0 errors | 32 GiB, 2 passes, 0 errors |
| Host to device | 56.88 GB/s | 56.96 GB/s |
| Device to host | 57.32 GB/s | 57.32 GB/s |
| Link under transfer | PCIe 5.0 x16 | PCIe 5.0 x16 |

These tests use pinned system memory, which allows fast transfers between the CPU and GPU. The two cards measured within 0.1 GB/s of each other and sustained about 57 GB/s in both directions.

### Direct GPU-to-GPU transfers

My first direct copy failed even though CUDA reported success. The second GPU still held its old data, and the kernel logged AMD IOMMU page faults.

On bare-metal Linux, [NVIDIA says to disable the input-output memory management unit (IOMMU)](https://docs.nvidia.com/cuda/cuda-programming-guide/03-advanced/multi-gpu-systems.html#host-iommu-hardware-pci-access-control-services-and-vms) for PCIe peer-to-peer transfers. Leaving it on can corrupt GPU memory without an error. I added `amd_iommu=off` to the boot settings, rebooted, and ran the checks again.

| Direction | Data check | Bandwidth |
|---|---:|---:|
| GPU 0 to GPU 1 | 64 MiB, 0 mismatches | 52.87 GB/s |
| GPU 1 to GPU 0 | 64 MiB, 0 mismatches | 52.95 GB/s |

The bandwidth test copied a 512 MiB buffer 64 times in each direction. I also ran a two-rank all-reduce through the NVIDIA Collective Communications Library (NCCL) with direct P2P enabled. NCCL used its `P2P/CUMEM` path, returned the expected value on both cards, and exited cleanly.

### BF16 compute

BF16 is a 16-bit number format used for modern model training. I used PyTorch to multiply dense 8192 x 8192 BF16 matrices. I measured each single-card test for 15 seconds, then ran both cards together for 30 seconds.

| Test | GPU 0 | GPU 1 | Combined |
|---|---:|---:|---:|
| Single-card BF16 matrix multiply | 236.43 TFLOPS | 217.54 TFLOPS | n/a |
| Dual-card BF16 matrix multiply | 229.11 TFLOPS | 211.85 TFLOPS | 440.96 TFLOPS |
| Power during dual test | 300 W | 300 W | 600 W |
| Peak temperature | 61°C | 61°C | n/a |

This test measures raw matrix multiplication. It does not measure NVIDIA's peak specification or tokens per second. I use it to find heat limits, unstable power, or a card that fails when both GPUs run at once.

GPU 1 was about 8% slower in this test. It still held full power, stayed cool, and passed the memory and PCIe checks. I will track that gap in real training and inference jobs before I draw a conclusion.

### Inference and LoRA with a 27B model

I also tested a model that I use on this machine: Qwen3.6-27B. The local model card says its BF16 files were rebuilt from a Q8_0 copy. These numbers describe this local checkpoint, not an official BF16 release.

For inference, I used [llama-benchy](https://github.com/eugr/llama-benchy) 0.4.0 against vLLM 0.25.1. It ran three times with one request at a time, 1,024 input tokens, exact 256-token output, and prefix caching off. The two-GPU test split the model across both cards with tensor parallelism. Its coherence check passed in both cases.

| Single-request test | One GPU | Two GPUs | Change |
|---|---:|---:|---:|
| Prompt processing | 4,760.5 tokens/s | 7,238.4 tokens/s | 1.52x |
| Token generation | 26.99 tokens/s | 49.46 tokens/s | 1.83x |
| Time to first token | 260.3 ms | 170.9 ms | 34.3% lower |


For training, I froze the base model and added rank-8 LoRA adapters to 256 attention and multilayer perceptron projections. That left 39,845,888 trainable parameters, or 0.145% of the model. Each GPU processed one 1,024-token sequence per step. I discarded two warmup steps and measured six optimizer steps.

| LoRA SFT test | One GPU | Two GPUs |
|---|---:|---:|
| Aggregate training throughput | 658.0 tokens/s | 1,365.8 tokens/s |
| Mean optimizer step | 1.56 s | 1.50 s |
| Global tokens per step | 1,024 | 2,048 |
| Peak allocated memory per GPU | 55.38 GiB | 55.69 GiB |

The two-GPU data-parallel run delivered 2.08x the aggregate throughput. Every loss stayed finite, and both ranks ended with the same adapter checksum. I used fixed synthetic tokens, so this short test measures system speed and training stability. It does not measure model quality.

## The stock fan curve was too conservative

The biggest surprise was cooling. During real training, the stock NVIDIA curve let one GPU reach roughly 87°C without pushing its blower past 60%. The other card was almost as hot.

<figure>
  <img src="/blog/images/blackwell-stock-fan-curve.webp" alt="nvidia-smi showing both RTX PRO 6000 Blackwell GPUs at 299 watts and full utilization, at 85 and 86 degrees Celsius while their fans run at 57 and 53 percent." loading="lazy">
  <figcaption>Both cards at 299 W and full utilization. The stock blowers were still only at 57% and 53%.</figcaption>
</figure>

I first maxed the 420 mm AIO and all six Noctua case fans. It barely changed the GPU temperatures. That made sense after I looked at the layout: the case had enough fresh air, but the blower curve was not moving that air through the cards fast enough.

I raised the GPU fan curve by roughly 15 to 20 percentage points. With that change, both cards hold around 75°C at full use during long training jobs. The extra blower noise is easy to accept on a machine built to run unattended work.

I turned the fix into an open-source controller with a compatibility check, installer, systemd service, and an `AGENTS.md` for AI-assisted setup: [nvidia-gpu-blower-controller](https://github.com/keithtyser/nvidia-gpu-blower-controller). Test the curve on your own hardware before installing it. Different cases, cards, and room temperatures need different settings.

## Problems from the first week

After more than a week of constant work, one PPO process exited badly. The GPU then reported 100% use, full clocks, and about 95 W even though no process was attached. The job failed while Python's multiprocessing code was shutting down and left shared-memory files behind. Starting a clean CUDA context reset the stale state. I fixed the shutdown code, repeated the run, and watched the card return to about 15 W within five seconds.

I also saw two earlier boots where one card logged an Xid 79, meaning the GPU had fallen off the PCIe bus. I checked both cards and found nothing loose or damaged. That is why I ran the tests above instead of assuming the machine was fine because the next boot looked normal.

These results do not show a failing GPU. Both cards passed the data checks, used PCIe 5.0 x16, ran together at full power, and stayed error-free. I will keep monitoring the affected PCIe path.

## My take so far

I bought this machine because I need GPU access almost every day, often for several jobs. I also wanted one environment that stays in place. That cuts out setup work: rebuilding environments, moving checkpoints, watching rental balances, and deciding whether a test is worth another paid hour.

With 96 GB on each card, more models and batch sizes fit without extra planning. The second GPU can increase throughput, run another service, or take a separate job.

The drawbacks are clear. Two 300 W blowers produce heat and noise. Multi-GPU software still needs care. A stock fan curve can stay within its limits and still run too hot for my sustained training jobs. I also have to solve every driver, process cleanup, and PCIe problem.

After its first week, the machine has spent much more time working than idle. I still have two DGX Sparks, Kaggle's 30 weekly GPU hours, Colab, and rented cards when I need them. I use the workstation for long jobs and services that need to stay running.

I still feel like I need more GPUs. That part has not changed.
