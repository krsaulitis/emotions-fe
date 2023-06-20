<script>
    import {fade} from 'svelte/transition';
    import {tick} from 'svelte';

    let timeout;
    let selectedModel = ['en'];
    let text = '';
    let predictedText = text;
    let predictions = [];
    let isDetailed = false;

    const models = [
        {
            value: "en",
            title: "🇬🇧",
        },
        {
            value: "lv",
            title: "🇱🇻",
        },
    ]

    function handleInput(e) {
        if (text === predictedText) {
            return;
        }
        clearTimeout(timeout)

        timeout = setTimeout(predict, 1500)
    }

    function handleFocusOut(e) {
        if (text === predictedText) {
            return;
        }
        clearTimeout(timeout)
        predict()
    }

    async function predict() {
        predictions = null;
        await tick()
        console.time('pred')
        const endpoint = '/api/predict?' + new URLSearchParams({q: text, m: selectedModel.join("_")})
        const response = await fetch(endpoint, {method: 'GET', headers: {'content-type': 'application/json'}})
        const data = await response.json()
        console.timeEnd('pred')
        predictions = data.predictions
        predictedText = text
    }
</script>

<svelte:head>
    <title>EmotionBert</title>
    <meta name="description" content="Svelte demo app"/>
</svelte:head>

<section class="flex flex-col items-center justify-center h-screen">
    <div>
        <h1 class="text-5xl font-bold text-neutral-300">EmotionBERT</h1>
        <input class="border-2 outline-0 border-neutral-600 focus:border-neutral-300 text-neutral-300 bg-neutral-900 rounded-lg px-3 py-1 w-full mt-5"
               bind:value={text}
               on:input={handleInput}
               on:focusout={handleFocusOut}
               type="text">
    </div>
    <div class="mt-5">
        {#if predictions}
            {#if isDetailed}
                <div class="absolute -translate-x-1/2">
                    {#each predictions as prediction}
                        <p class="text-xl text-neutral-300">{prediction.icon} {prediction.label} - {prediction.confidence.toFixed(3)}</p>
                    {/each}
                </div>
            {:else}
                <p transition:fade={{delay: 0, duration: 250}} class="absolute -translate-x-1/2 text-3xl">
                    {#each predictions as prediction}
                        <span class="mx-1">{prediction.icon}</span>
                    {/each}
                </p>
            {/if}
        {/if}
    </div>
    <div class="absolute bottom-10 flex justify-center items-center gap-3">
        {#each models as model}
            <label class="text-3xl cursor-pointer {selectedModel.includes(model.value) ? '' : 'grayscale'}">
                <input bind:group={selectedModel}
                       on:change={() => predict()}
                       type="checkbox" value="{model.value}" hidden>
                {model.title}
            </label>
        {/each}
    </div>
    <label class="absolute bottom-10 right-10 text-3xl cursor-pointer {isDetailed ? '' : 'brightness-50'}">
        <input type="checkbox" bind:checked={isDetailed} hidden> 🔬
    </label>
</section>
