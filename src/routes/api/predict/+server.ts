import type {RequestHandler} from "@sveltejs/kit"
// @ts-ignore
import {BertWordPieceTokenizer} from '@nlpjs/bert-tokenizer'
import * as onnx from 'onnxruntime-node'
import vocabLV from '$lib/vocab_lv.txt'
import vocabEN from '$lib/vocab_en.txt'
import vocabENLV from '$lib/vocab_en_lv.txt'
// import * as onnx from 'onnxruntime-common'
import {buildInt64, labelMap, padOrClip, sigmoid} from '$lib/helpers'
import * as fs from "fs";

export const GET: RequestHandler = async ({request, url}) => {
    const text = url.searchParams.get('q') || '';
    const model = url.searchParams.get('m') || 'en';

    const files = fs.readdirSync('./.svelte-kit', {recursive: true})
    console.log(files);
    const vocab = fs.readFileSync(vocabLV, 'utf8')
    console.log(vocab)
    console.log(onnx.InferenceSession)
    const session = await onnx.InferenceSession.create("https://huggingface.co/krsaulitis/emotion-bert-lv/resolve/main/model_lv.onnx")
    // const tokenizer = new BertTokenizer(`./src/lib/vocab_${model}.json`, false, 64)
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