import type {RequestHandler} from "@sveltejs/kit"
// @ts-ignore
import {BertWordPieceTokenizer} from '@nlpjs/bert-tokenizer'
import onnx from 'onnxruntime-node'
import {buildInt64, labelMap, padOrClip, sigmoid} from '$lib/helpers'
import * as fs from "fs";

export const GET: RequestHandler = async ({request, url}) => {
    const text = url.searchParams.get('q') || '';
    const model = url.searchParams.get('m') || 'en';

    // const modResponse = await fetch("https://huggingface.co/krsaulitis/emotion-bert-lv/resolve/main/model_lv.onnx")
    // const session = await onnx.InferenceSession.create(await modResponse.arrayBuffer())
    const vocab = fs.readFileSync(`src/lib/vocab_${model}.txt`, 'utf8')
    const session = await onnx.InferenceSession.create(`./src/lib/model_${model}.onnx`)
    const tokenizer = new BertWordPieceTokenizer({lowercase: false, vocabContent: vocab})

    let encoding = tokenizer.encodeQuestion(text)
    let inputIds = padOrClip(encoding.ids, 64)
    let inputMask = padOrClip(encoding.attentionMask, 64)

    const inputIdsTensor = new onnx.Tensor('int64', buildInt64(inputIds), [1, 64])
    const inputMaskTensor = new onnx.Tensor('int64', buildInt64(inputMask), [1, 64])

    const results = await session.run({
        input: inputIdsTensor,
        attention_mask: inputMaskTensor,
    })

    // @ts-ignore
    const predictions: number[] = Array.from(results.output.data);
    const sig_predictions = predictions.map(x => sigmoid(x))
    let indices: number[] = sig_predictions
        .map((e, i) => e > 0.3 ? i : -1)
        .filter((e) => e != -1);

    return new Response(JSON.stringify({
        "predictions": indices.map((index: number) => ({
            id: index,
            label: Object.keys(labelMap)[index],
            icon: Object.values(labelMap)[index],
            confidence: sig_predictions[index],
        })),
    }))
}
