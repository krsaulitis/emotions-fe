import type {RequestHandler} from "@sveltejs/kit"
import {BertTokenizer} from 'bert-tokenizer'
import * as onnx from 'onnxruntime-node'
import {buildInt64, labelMap, sigmoid} from '$lib/helpers'

export const GET: RequestHandler = async ({request, url}) => {
    const text = url.searchParams.get('q') || '';
    const model = 'en'//url.searchParams.get('m') || 'en';

    const session = await onnx.InferenceSession.create(`./src/lib/model_${model}.onnx`)
    const tokenizer = new BertTokenizer(`./src/lib/vocab_${model}.json`, false, 64)

    const {inputIds, segmentIds, inputMask} = tokenizer.convertSingleExample(text)
    const inputIdsTensor = new onnx.Tensor('int64', buildInt64(inputIds), [1, 64])
    const inputMaskTensor = new onnx.Tensor('int64', buildInt64(inputMask), [1, 64])

    const results = await session.run({
        input: inputIdsTensor,
        attention_mask: inputMaskTensor,
    })

    // @ts-ignore
    const predictions: number[] = Array.from(results.output.data);
    const sig_predictions = predictions.map(x => sigmoid(x))
    console.log(sig_predictions)
    let indices: number[] = sig_predictions
        .map((e, i) => e > 0.3 ? i : -1)
        .filter((e) => e != -1);

    return new Response(JSON.stringify({
        "predictions": indices.map((index: number) => ({
            id: index,
            label: Object.keys(labelMap)[index],
            icon: Object.values(labelMap)[index],
        })),
    }))
}