#!/usr/bin/env node
/**
 * Генерация серии картинок через локальный ComfyUI.
 *
 * Usage:
 *   node .claude/skills/whg-imagegen/imagegen.mjs doctor [--host ...] [--models <папка models ComfyUI>]
 *   node .claude/skills/whg-imagegen/imagegen.mjs <series.json> [--only <id,id>] [--engine qwen|flux] [--draft]
 *                                                  [--host http://127.0.0.1:8188]
 *
 * Серия - это файл series.json: общий стиль, параметры модели и список картинок
 * с seed. Стиль приклеивается к предмету картинки здесь, а не руками в каждом
 * промпте: так серия не расходится, а повторный прогон с тем же seed на той же
 * модели и версии ComfyUI даёт ту же картинку.
 *
 * Результат - <папка серии>/out/<engine>/<id>.png и рядом <id>.json с тем, что ушло
 * в ComfyUI. Папка out в git не идёт, воспроизводится из series.json.
 *
 * series.json:
 *   {
 *     "name": "...",
 *     "engine": "qwen",                      // модель по умолчанию
 *     "style": "...",                        // приклеивается к каждому subject
 *     "negative": "...",
 *     "sizes": { "16:9": [1664, 928] },      // необязательно, есть стандартные
 *     "items": [{ "id": "hero", "subject": "...", "size": "16:9", "seed": 101 }]
 *   }
 *
 * Картинка-правка берёт готовую и меняет в ней одно - так тёмная пара остаётся
 * той же комнатой, а не новой генерацией:
 *   { "id": "hero-dark", "source": "out/qwen/hero.png", "edit": "Make it night...", "seed": 101 }
 * source - путь относительно series.json; модель - Qwen-Image-Edit-2511.
 */
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';

const { values: args, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    only: { type: 'string' },
    engine: { type: 'string' },
    draft: { type: 'boolean', default: false },
    host: { type: 'string', default: 'http://127.0.0.1:8188' },
    models: { type: 'string' },
  },
});

const seriesPath = positionals[0];
if (!seriesPath) {
  console.error(
    'Usage: node .claude/skills/whg-imagegen/imagegen.mjs <series.json|doctor> [--only id] [--draft]',
  );
  process.exit(2);
}

// Размеры под пропорции - из официальных шаблонов ComfyUI для обеих моделей.
const SIZES = {
  qwen: {
    '1:1': [1328, 1328],
    '16:9': [1664, 928],
    '9:16': [928, 1664],
    '4:3': [1472, 1104],
    '3:4': [1104, 1472],
    '3:2': [1584, 1056],
    '2:3': [1056, 1584],
  },
  flux: {
    '1:1': [1024, 1024],
    '16:9': [1344, 768],
    '9:16': [768, 1344],
    '4:3': [1152, 864],
    '3:4': [864, 1152],
    '3:2': [1216, 832],
    '2:3': [832, 1216],
  },
};

/*
  Параметры моделей - по официальным шаблонам ComfyUI.
  Qwen-Image-2512: 50 шагов, cfg 4, euler/simple, сдвиг 3.1; черновик - Lightning-LoRA
  на 8 шагов с cfg 1. Flux.1-dev: 20 шагов, cfg 1, guidance 3.5 внутри модели.
*/
const ENGINES = {
  qwen: {
    unet: 'qwen_image_2512_fp8_e4m3fn.safetensors',
    clip: 'qwen_2.5_vl_7b_fp8_scaled.safetensors',
    vae: 'qwen_image_vae.safetensors',
    shift: 3.1,
    full: { steps: 50, cfg: 4 },
    draft: { steps: 8, cfg: 1, lora: 'Qwen-Image-2512-Lightning-8steps-V1.0-bf16.safetensors' },
    sampler: 'euler',
    scheduler: 'simple',
  },
  flux: {
    ckpt: 'flux1-dev-fp8.safetensors',
    guidance: 3.5,
    full: { steps: 20, cfg: 1 },
    draft: { steps: 12, cfg: 1 },
    sampler: 'euler',
    scheduler: 'simple',
  },
};

function qwenGraph(e, p) {
  const mode = args.draft ? e.draft : e.full;
  const g = {
    1: { class_type: 'UNETLoader', inputs: { unet_name: e.unet, weight_dtype: 'default' } },
    2: {
      class_type: 'CLIPLoader',
      inputs: { clip_name: e.clip, type: 'qwen_image', device: 'default' },
    },
    3: { class_type: 'VAELoader', inputs: { vae_name: e.vae } },
    5: { class_type: 'ModelSamplingAuraFlow', inputs: { model: ['1', 0], shift: e.shift } },
    6: { class_type: 'CLIPTextEncode', inputs: { text: p.positive, clip: ['2', 0] } },
    7: { class_type: 'CLIPTextEncode', inputs: { text: p.negative, clip: ['2', 0] } },
    8: {
      class_type: 'EmptySD3LatentImage',
      inputs: { width: p.width, height: p.height, batch_size: 1 },
    },
    9: {
      class_type: 'KSampler',
      inputs: {
        model: ['5', 0],
        positive: ['6', 0],
        negative: ['7', 0],
        latent_image: ['8', 0],
        seed: p.seed,
        steps: mode.steps,
        cfg: mode.cfg,
        sampler_name: e.sampler,
        scheduler: e.scheduler,
        denoise: 1,
      },
    },
    10: { class_type: 'VAEDecode', inputs: { samples: ['9', 0], vae: ['3', 0] } },
    11: {
      class_type: 'SaveImage',
      inputs: { images: ['10', 0], filename_prefix: `imagegen/${p.id}` },
    },
  };
  if (args.draft) {
    g[4] = {
      class_type: 'LoraLoaderModelOnly',
      inputs: { model: ['1', 0], lora_name: mode.lora, strength_model: 1 },
    };
    g[5].inputs.model = ['4', 0];
  }
  return g;
}

function fluxGraph(e, p) {
  const mode = args.draft ? e.draft : e.full;
  return {
    1: { class_type: 'CheckpointLoaderSimple', inputs: { ckpt_name: e.ckpt } },
    6: { class_type: 'CLIPTextEncode', inputs: { text: p.positive, clip: ['1', 1] } },
    7: { class_type: 'FluxGuidance', inputs: { conditioning: ['6', 0], guidance: e.guidance } },
    // Flux.1-dev обучен без отрицательного промпта; при cfg 1 его ветка не считается.
    12: { class_type: 'CLIPTextEncode', inputs: { text: '', clip: ['1', 1] } },
    8: {
      class_type: 'EmptySD3LatentImage',
      inputs: { width: p.width, height: p.height, batch_size: 1 },
    },
    9: {
      class_type: 'KSampler',
      inputs: {
        model: ['1', 0],
        positive: ['7', 0],
        negative: ['12', 0],
        latent_image: ['8', 0],
        seed: p.seed,
        steps: mode.steps,
        cfg: mode.cfg,
        sampler_name: e.sampler,
        scheduler: e.scheduler,
        denoise: 1,
      },
    },
    10: { class_type: 'VAEDecode', inputs: { samples: ['9', 0], vae: ['1', 2] } },
    11: {
      class_type: 'SaveImage',
      inputs: { images: ['10', 0], filename_prefix: `imagegen/${p.id}` },
    },
  };
}

/*
  Правка готовой картинки - по официальному шаблону Qwen-Image-Edit-2511:
  исходник масштабируется, кодируется в латент и идёт в сэмплер вместе с
  инструкцией; 40 шагов, cfg 4, CFGNorm поверх сдвига 3.1.
*/
const EDIT = {
  unet: 'qwen_image_edit_2511_fp8mixed.safetensors',
  clip: 'qwen_2.5_vl_7b_fp8_scaled.safetensors',
  vae: 'qwen_image_vae.safetensors',
  steps: 40,
  cfg: 4,
};

function editGraph(p, uploaded) {
  const encode = (prompt) => ({
    class_type: 'TextEncodeQwenImageEditPlus',
    inputs: { clip: ['2', 0], vae: ['3', 0], image1: ['21', 0], prompt },
  });
  return {
    1: { class_type: 'UNETLoader', inputs: { unet_name: EDIT.unet, weight_dtype: 'default' } },
    2: {
      class_type: 'CLIPLoader',
      inputs: { clip_name: EDIT.clip, type: 'qwen_image', device: 'default' },
    },
    3: { class_type: 'VAELoader', inputs: { vae_name: EDIT.vae } },
    4: { class_type: 'ModelSamplingAuraFlow', inputs: { model: ['1', 0], shift: 3.1 } },
    5: { class_type: 'CFGNorm', inputs: { model: ['4', 0], strength: 1 } },
    20: { class_type: 'LoadImage', inputs: { image: uploaded } },
    /*
      Шаблон подгоняет исходник под размеры Kontext, и правка выходит другого
      кадра (1664x928 -> 1392x752): при смене темы картинка сдвигается. Родной
      размер Qwen проходит без подгонки, поэтому масштаб - только по просьбе.
    */
    21: p.scale
      ? { class_type: 'FluxKontextImageScale', inputs: { image: ['20', 0] } }
      : {
          class_type: 'ImageScaleBy',
          inputs: { image: ['20', 0], upscale_method: 'lanczos', scale_by: 1 },
        },
    22: { class_type: 'VAEEncode', inputs: { pixels: ['21', 0], vae: ['3', 0] } },
    6: encode(p.positive),
    7: encode(''),
    16: {
      class_type: 'FluxKontextMultiReferenceLatentMethod',
      inputs: { conditioning: ['6', 0], reference_latents_method: 'index_timestep_zero' },
    },
    17: {
      class_type: 'FluxKontextMultiReferenceLatentMethod',
      inputs: { conditioning: ['7', 0], reference_latents_method: 'index_timestep_zero' },
    },
    9: {
      class_type: 'KSampler',
      inputs: {
        model: ['5', 0],
        positive: ['16', 0],
        negative: ['17', 0],
        latent_image: ['22', 0],
        seed: p.seed,
        steps: EDIT.steps,
        cfg: EDIT.cfg,
        sampler_name: 'euler',
        scheduler: 'simple',
        denoise: 1,
      },
    },
    10: { class_type: 'VAEDecode', inputs: { samples: ['9', 0], vae: ['3', 0] } },
    // Правка в размере Kontext выходит кадром уже исходника; подгоняем обратно,
    // чтобы светлая и тёмная версии совпадали при смене темы.
    23: {
      class_type: 'ImageScale',
      inputs: {
        image: ['10', 0],
        upscale_method: 'lanczos',
        width: p.width,
        height: p.height,
        crop: 'center',
      },
    },
    11: {
      class_type: 'SaveImage',
      inputs: { images: [p.scale ? '23' : '10', 0], filename_prefix: `imagegen/${p.id}` },
    },
  };
}

/** Ширина и высота PNG из заголовка. */
function pngSize(file) {
  const head = fs.readFileSync(file).subarray(16, 24);
  return [head.readUInt32BE(0), head.readUInt32BE(4)];
}

/** Кладёт исходник в input ComfyUI; имя с отпечатком, чтобы разные файлы не путались. */
async function upload(file) {
  const bytes = fs.readFileSync(file);
  const name = `imagegen-${path.basename(file, '.png')}-${bytes.length}.png`;
  const form = new FormData();
  form.append('image', new Blob([bytes], { type: 'image/png' }), name);
  form.append('overwrite', 'true');
  const res = await (await api('/upload/image', { method: 'POST', body: form })).json();
  return res.name;
}

async function api(route, init) {
  const res = await fetch(`${args.host}${route}`, init);
  if (!res.ok) throw new Error(`${route}: HTTP ${res.status} ${await res.text()}`);
  return res;
}

async function run(graph) {
  const { prompt_id: id } = await (
    await api('/prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: graph }),
    })
  ).json();
  for (;;) {
    await new Promise((r) => setTimeout(r, 2000));
    const hist = await (await api(`/history/${id}`)).json();
    const entry = hist[id];
    if (!entry) continue;
    if (entry.status?.status_str === 'error') {
      throw new Error(`ComfyUI: ${JSON.stringify(entry.status.messages).slice(0, 500)}`);
    }
    const images = Object.values(entry.outputs ?? {}).flatMap((o) => o.images ?? []);
    if (images.length) return images[0];
  }
}

/*
  Проверка готовности: есть ли ComfyUI, нужные модели и ресурсы на них.
  Итог - одно из трёх: работать, поставить (с командами) или не применять навык.
  Порог ресурсов - проверенный: 24 ГБ видеопамяти хватает; меньше не проверялось.
*/
const REQUIRED = [
  [
    'diffusion_models',
    'qwen_image_2512_fp8_e4m3fn.safetensors',
    'Comfy-Org/Qwen-Image_ComfyUI/resolve/main/split_files/diffusion_models/qwen_image_2512_fp8_e4m3fn.safetensors',
    20.4,
  ],
  [
    'diffusion_models',
    'qwen_image_edit_2511_fp8mixed.safetensors',
    'Comfy-Org/Qwen-Image-Edit_ComfyUI/resolve/main/split_files/diffusion_models/qwen_image_edit_2511_fp8mixed.safetensors',
    20.5,
  ],
  [
    'text_encoders',
    'qwen_2.5_vl_7b_fp8_scaled.safetensors',
    'Comfy-Org/Qwen-Image_ComfyUI/resolve/main/split_files/text_encoders/qwen_2.5_vl_7b_fp8_scaled.safetensors',
    9.4,
  ],
  [
    'vae',
    'qwen_image_vae.safetensors',
    'Comfy-Org/Qwen-Image_ComfyUI/resolve/main/split_files/vae/qwen_image_vae.safetensors',
    0.25,
  ],
  [
    'loras',
    'Qwen-Image-2512-Lightning-8steps-V1.0-bf16.safetensors',
    'lightx2v/Qwen-Image-2512-Lightning/resolve/main/Qwen-Image-2512-Lightning-8steps-V1.0-bf16.safetensors',
    0.8,
  ],
];

async function doctor() {
  const { execFileSync } = await import('node:child_process');
  const lines = [];
  let gpuGb = 0;
  try {
    const out = execFileSync(
      'nvidia-smi',
      ['--query-gpu=name,memory.total', '--format=csv,noheader,nounits'],
      { encoding: 'utf8' },
    );
    const [name, mib] = out
      .trim()
      .split(String.fromCharCode(10))[0]
      .split(',')
      .map((x) => x.trim());
    gpuGb = Number(mib) / 1024;
    lines.push(`видеокарта: ${name}, ${gpuGb.toFixed(0)} ГБ`);
  } catch {
    lines.push('видеокарта: NVIDIA не найдена (nvidia-smi недоступен)');
  }

  let comfy = null;
  try {
    comfy = await (await fetch(`${args.host}/system_stats`)).json();
    lines.push(`ComfyUI: ${comfy.system?.comfyui_version ?? '?'} на ${args.host}`);
  } catch {
    lines.push(`ComfyUI: не отвечает на ${args.host}`);
  }

  const missing = [];
  if (comfy) {
    const listed = new Set();
    for (const [node, input] of [
      ['UNETLoader', 'unet_name'],
      ['CLIPLoader', 'clip_name'],
      ['VAELoader', 'vae_name'],
      ['LoraLoaderModelOnly', 'lora_name'],
    ]) {
      const info = await (await fetch(`${args.host}/object_info/${node}`)).json();
      for (const f of info[node]?.input?.required?.[input]?.[0] ?? []) listed.add(f);
    }
    for (const r of REQUIRED) if (!listed.has(r[1])) missing.push(r);
  } else {
    missing.push(...REQUIRED);
  }

  const needGb = missing.reduce((sum, r) => sum + r[3], 0) + (comfy ? 0 : 2);
  let freeGb = null;
  const target = args.models ?? process.cwd();
  try {
    freeGb = (fs.statfsSync(target).bavail * fs.statfsSync(target).bsize) / 1e9;
    lines.push(
      `свободно на диске (${target}): ${freeGb.toFixed(0)} ГБ, нужно ещё ~${needGb.toFixed(0)} ГБ`,
    );
  } catch {
    lines.push(`свободно на диске: не удалось узнать для ${target}`);
  }

  console.log(lines.map((l) => `  ${l}`).join(String.fromCharCode(10)));

  if (comfy && missing.length === 0) {
    console.log('');
    console.log('ГОТОВО: ComfyUI и все модели на месте.');
    return;
  }
  if (gpuGb === 0) {
    console.log('');
    console.log(
      'НЕ ПРИМЕНЯТЬ: без видеокарты NVIDIA генерация недоступна. Навык отключается до смены машины.',
    );
    process.exitCode = 3;
    return;
  }
  if (gpuGb < 23) {
    console.log('');
    console.log(
      `НЕ ПРОВЕРЕНО: ${gpuGb.toFixed(0)} ГБ видеопамяти меньше проверенных 24 ГБ. ComfyUI выгружает веса в память, может работать, но медленно - ставить только по решению владельца.`,
    );
  }
  if (freeGb !== null && freeGb < needGb + 10) {
    console.log('');
    console.log(
      `НЕ ПРИМЕНЯТЬ: на диске ${freeGb.toFixed(0)} ГБ, а с запасом нужно ${(needGb + 10).toFixed(0)} ГБ. Освободи место или укажи другой диск через --models.`,
    );
    process.exitCode = 3;
    return;
  }
  console.log('');
  console.log('МОЖНО ПОСТАВИТЬ (с согласия владельца):');
  if (!comfy) {
    console.log(
      '  1. ComfyUI portable для NVIDIA: https://github.com/Comfy-Org/ComfyUI/releases (ComfyUI_windows_portable_nvidia.7z),',
    );
    console.log(
      '     распаковать, запустить: python_embeded/python.exe -s ComfyUI/main.py --listen 127.0.0.1 --port 8188',
    );
  }
  for (const [dir, file, url] of missing) {
    console.log(
      `  curl -L -C - -o "<ComfyUI>/models/${dir}/${file}" https://huggingface.co/${url}`,
    );
  }
  process.exitCode = 2;
}

if (seriesPath === 'doctor') {
  await doctor();
  process.exit();
}

const series = JSON.parse(fs.readFileSync(seriesPath, 'utf8'));
const engineName = args.engine ?? series.engine ?? 'qwen';
const engine = ENGINES[engineName];
if (!engine) {
  console.error(`Неизвестная модель: ${engineName}`);
  process.exit(2);
}
const sizes = { ...SIZES[engineName], ...(series.sizes?.[engineName] ?? {}) };
const only = args.only ? new Set(args.only.split(',')) : null;
const outDir = path.join(
  path.dirname(seriesPath),
  'out',
  engineName + (args.draft ? '-draft' : ''),
);
fs.mkdirSync(outDir, { recursive: true });

for (const item of series.items) {
  if (only && !only.has(item.id)) continue;
  const [width, height] = sizes[item.size ?? '16:9'];
  const p = {
    id: item.id,
    seed: item.seed,
    width,
    height,
    positive: item.edit ?? [item.subject, item.style ?? series.style].filter(Boolean).join('. '),
    negative: item.negative ?? series.negative ?? '',
  };
  let graph;
  if (item.edit) {
    const sourceFile = path.join(path.dirname(seriesPath), item.source);
    p.source = item.source;
    p.scale = Boolean(item.scale);
    [p.width, p.height] = pngSize(sourceFile);
    graph = editGraph(p, await upload(sourceFile));
  } else {
    graph = engineName === 'qwen' ? qwenGraph(engine, p) : fluxGraph(engine, p);
  }
  const started = Date.now();
  const img = await run(graph);
  const seconds = Math.round((Date.now() - started) / 1000);
  const q = new URLSearchParams({
    filename: img.filename,
    subfolder: img.subfolder,
    type: img.type,
  });
  const png = Buffer.from(await (await api(`/view?${q}`)).arrayBuffer());
  fs.writeFileSync(path.join(outDir, `${item.id}.png`), png);
  fs.writeFileSync(
    path.join(outDir, `${item.id}.json`),
    JSON.stringify({ engine: engineName, draft: args.draft, seconds, ...p, graph }, null, 2),
  );
  console.log(`${item.id}: ${width}x${height}, seed ${item.seed}, ${seconds} с`);
}
