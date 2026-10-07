---
title: "Run ML Models Use Qualcomm SNPE Part 2 `torchvision.models.resnext50`"
---

#software #accelerator #ai #on-device #WIP

In this part of the tutorial, we will learn how to run a pretrained model from TorchVision: ResNeXt50, which is a model architecture built upon the concepts of ResNet.

## Preparation

### Companion git repo

If you haven't cloned the git repo,

```
git clone https://github.com/jimwang99/xrbench-snapdragon.git
cd xrbench-snapdragon/pytorch_model/resnext50
```

### Imagenet dataset

To run quantized model on device, we need to download the following ImageNet dataset from HuggingFace: [imagenet-1k](https://huggingface.co/datasets/imagenet-1k/blob/main/data).

To save download time, we can only choose the validation set.

In the following sections, we assume an environment variable `IMAGENET_DATASET` is pointing to its location.

## Model Conversion

The pretrained model from PyTorch is can be saved into TorchScript format. And we need to convert it from TorchScript format to SNPE DLC format, so that SNPE toolchain can use it.

> NOTE: although PyTorch 2.0 has been released with substantial updates with TorchDynamo as one of it, SNPE toolchain is still using TorchScript from 1.x era.

```
make prepare_model
```

### Export TorchScript

First part of the above command will call `export()` which uses `torch.jit.trace()` to trace the model and pre-trained weights downloaded from pytorch.org and save it as PTJ file

Detailed command line is
```
snpe-pytorch-to-dlc --input_dim "input0" 1,3,224,224 --input_dtype "input0" float32 --input_layout "input0" NCHW --input_network resnext50.ptj --output_path resnext50.dlc
```

### Convert PTJ to DLC

Second part of the above command will use `snpe-pytorch-to-dlc` to convert PTJ to DLC format.

### Test model on host

```
make prepare_test_images
```

> NOTE: SNPE uses NHWC tensor layout, instead of NCHW which is default for PyTorch. Therefore, while preparing test image, we need to do permutation.

```
make test_model_on_host
```

## Quantization

SNPE uses `snpe-dlc-quantize` to quantize a fp32 model into int8. It requires
- Sample input dataset that is representative
    - Usually 50~100 examples are enough, and they should cover all the output types/classes of the model

Galaxy S22 supports 3 runtimes: CPU, GPU and DSP:
- By default, CPU and GPU runtime takes floating-point model
- GPU runtime only supports non-quantized model
    - Quantized model will be converted back to floating-point version while model loading phase
- DSP runtime only supports quantized model
    - Non-quantized model will be quantized (usually without sufficient input samples, quantization loss can be large) while model loading phase

```
make quantize_model
```
