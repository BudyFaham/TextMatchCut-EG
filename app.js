const $ = (selector) => document.querySelector(selector);
const keyword = $('#keyword');
const generate = $('#generate');
const validation = $('#validation');
const controls = $('#controls');
const result = $('#result');
const preview = $('#preview');
const download = $('#download');
const progressArea = $('#progressArea');
const progressBar = $('#progressBar');
const progressText = $('#progressText');
const progressPct = $('#progressPct');
const autoPhrase = $('#autoPhrase');

const templates = [
  (k) => `خبر جديد عن ${k} قلب الكلام كله`,
  (k) => `${k} رجع يظهر تاني، ومحدش عارف ليه`,
  (k) => `تقرير: ${k} تحت السيطرة. غالبًا.`,
  (k) => `الناس سألت عن ${k} والرد لسه في الطريق`,
  (k) => `خبراء بيتابعوا تطورات ${k} يوم بيوم`
];
const bodies = [
  'الموضوع بدأ بتصريح صغير، وبعدها كبر لوحده.',
  'مصادر قريبة من الحكاية قالت إن التفاصيل لسه مش واضحة.',
  'الناس مستنية تفسير، والرد الرسمي قال هنرجع لكم.',
  'النتيجة النهائية لسه ما ظهرتش، بس الكلام كتير.',
  'التقرير الجديد جمع آراء كتير، ومحدش اتفق على كل حاجة.',
  'فيه تحديثات متوقعة قريب، لو حصلت هنقولك.'
];

let ratio = '9:16';
let lastUrl = null;
let busy = false;

function previewPhrase() {
  const word = keyword.value.trim() || 'كلمتك';
  autoPhrase.textContent = templates[1](word);
}
keyword.addEventListener('input', previewPhrase);
previewPhrase();

$('#advancedToggle').addEventListener('click', (event) => {
  const open = event.currentTarget.getAttribute('aria-expanded') === 'true';
  event.currentTarget.setAttribute('aria-expanded', String(!open));
  $('#advanced').classList.toggle('visible', !open);
});
$('#cps').addEventListener('input', (event) => { $('#cpsValue').textContent = event.target.value; });
$('#zoom').addEventListener('input', (event) => { $('#zoomValue').textContent = Number(event.target.value).toFixed(1); });
$('#blur').addEventListener('input', (event) => { $('#blurValue').textContent = Number(event.target.value).toFixed(1); });

document.querySelectorAll('[data-ratio]').forEach((button) => button.addEventListener('click', () => {
  ratio = button.dataset.ratio;
  document.querySelectorAll('[data-ratio]').forEach((item) => item.classList.toggle('active', item === button));
}));

document.querySelectorAll('.example-card').forEach((button) => button.addEventListener('click', () => {
  keyword.value = button.dataset.keyword;
  previewPhrase();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  setTimeout(() => generate.click(), 250);
}));

function validate() {
  if (!keyword.value.trim()) return 'اكتب الكلمة الأول.';
  if (keyword.value.trim().length < 2) return 'اكتب كلمة أطول شوية عشان التأثير يبان.';
  return '';
}
function size() {
  if (ratio === '9:16') return [540, 960];
  if (ratio === '16:9') return [960, 540];
  return [720, 720];
}
function hash(seed) {
  let value = 2166136261;
  for (const character of String(seed)) {
    value ^= character.charCodeAt(0);
    value = Math.imul(value, 16777619);
  }
  return () => {
    value += 0x6d2b79f5;
    let t = Math.imul(value ^ value >>> 15, 1 | value);
    t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function wrap(context, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (context.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}
function drawPaper(context, width, height, word, seed, zoom, blur) {
  const random = hash(seed);
  const background = ['#fffdf7', '#f4f0e7', '#ffffff', '#eee9df'][Math.floor(random() * 4)];
  context.fillStyle = background;
  context.fillRect(0, 0, width, height);
  context.save();
  context.translate(width / 2, height / 2);
  context.scale(zoom, zoom);
  context.translate(-width / 2 + Math.round((random() - .5) * width * .12), -height / 2 + Math.round((random() - .5) * height * .12));
  const padding = width * .055;
  const columnWidth = width - padding * 2;
  context.direction = 'rtl';
  context.textAlign = 'center';
  context.fillStyle = '#171717';
  context.globalAlpha = .2;
  context.fillRect(padding, height * .12, columnWidth, 2);
  context.globalAlpha = 1;
  context.font = `800 ${Math.max(30, height * .075)}px Cairo`;
  const headline = templates[Math.floor(random() * templates.length)](word);
  const headlineLines = wrap(context, headline, columnWidth);
  let y = height * .22;
  for (const line of headlineLines) {
    const start = line.indexOf(word);
    if (start >= 0) {
      const before = line.slice(0, start);
      const after = line.slice(start + word.length);
      const beforeWidth = context.measureText(before).width;
      const wordWidth = context.measureText(word).width;
      const afterWidth = context.measureText(after).width;
      context.fillStyle = '#f4d21e';
      context.fillRect(width / 2 + (beforeWidth - afterWidth) / 2 - wordWidth / 2 - 8, y - height * .065, wordWidth + 16, height * .09);
      context.fillStyle = '#171717';
    }
    context.fillText(line, width / 2, y);
    y += height * .095;
  }
  context.font = `600 ${Math.max(16, height * .027)}px Cairo`;
  context.textAlign = 'right';
  context.fillStyle = '#38342d';
  const body = [...bodies, ...bodies].sort(() => random() - .5).join(' ');
  const bodyLines = wrap(context, body, columnWidth);
  let bodyY = height * .52;
  for (let index = 0; index < Math.min(bodyLines.length, 12); index += 1) {
    context.fillText(bodyLines[index], width - padding, bodyY);
    bodyY += height * .045;
  }
  context.globalAlpha = .5;
  context.fillStyle = '#777';
  context.font = `500 ${Math.max(13, height * .02)}px Cairo`;
  context.fillText('جريدة كلمتك ثابتة — عدد النهارده', width - padding, height * .91);
  context.restore();
  const gradient = context.createRadialGradient(width / 2, height / 2, Math.min(width, height) * .12, width / 2, height / 2, Math.min(width, height) * .72);
  gradient.addColorStop(0, `rgba(255,255,255,${Math.max(0, .28 - blur * .1)})`);
  gradient.addColorStop(.38, 'rgba(255,255,255,0)');
  gradient.addColorStop(1, `rgba(30,25,15,${Math.min(.7, blur * .3)})`);
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
}
function getMime() {
  if (!window.MediaRecorder || !MediaRecorder.isTypeSupported) return ['', 'webm'];
  const requested = $('#format').value;
  if (requested === 'mp4') {
    const mp4 = ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4;codecs=avc1', 'video/mp4'].find((item) => MediaRecorder.isTypeSupported(item));
    if (mp4) return [mp4, 'mp4'];
  }
  const webm = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find((item) => MediaRecorder.isTypeSupported(item));
  return [webm || '', 'webm'];
}
function playTone(audioContext, destination, type) {
  if (!audioContext || type === 'none') return;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = type === 'camera' ? 'square' : 'triangle';
  oscillator.frequency.setValueAtTime(type === 'camera' ? 420 : 260, audioContext.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(type === 'camera' ? 120 : 90, audioContext.currentTime + .08);
  gain.gain.setValueAtTime(.0001, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(.16, audioContext.currentTime + .008);
  gain.gain.exponentialRampToValueAtTime(.0001, audioContext.currentTime + .14);
  oscillator.connect(gain).connect(destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + .16);
}
function resetBusy() {
  $('.button-label').textContent = 'اعمل الفيديو';
  generate.disabled = false;
  generate.classList.remove('busy');
  busy = false;
}
async function makeVideo() {
  const error = validate();
  if (error) { validation.textContent = error; return; }
  if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) {
    validation.textContent = 'المتصفح ده مش بيدعم توليد الفيديو. افتح الموقع على Chrome أو Edge حديث.';
    return;
  }
  validation.textContent = '';
  busy = true;
  generate.disabled = true;
  generate.classList.add('busy');
  $('.button-label').textContent = 'بنجهّز الفيديو…';
  controls.classList.remove('hidden');
  result.classList.add('hidden');
  progressArea.classList.remove('hidden');
  progressBar.style.width = '0%';
  progressPct.textContent = '0%';
  progressText.textContent = 'بنحضّر الخطوط والرندر…';

  let audioContext;
  try {
    if (document.fonts?.ready) await document.fonts.ready;
    const [width, height] = size();
    const fps = 30;
    const cutsPerSecond = Number($('#cps').value);
    const cuts = Math.min(18, Math.max(8, Math.round(cutsPerSecond * 1.35)));
    const framesPerCut = Math.max(2, Math.round(fps / cutsPerSecond));
    const totalFrames = cuts * framesPerCut;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d', { alpha: false });
    const videoStream = canvas.captureStream(fps);
    const sound = $('#sound').value;
    let outputStream = videoStream;
    let audioDestination;
    if (sound !== 'none' && window.AudioContext) {
      audioContext = new AudioContext();
      audioDestination = audioContext.createMediaStreamDestination();
      outputStream = new MediaStream([...videoStream.getVideoTracks(), ...audioDestination.stream.getAudioTracks()]);
    }
    const [mimeType] = getMime();
    const recorder = new MediaRecorder(outputStream, mimeType ? { mimeType, videoBitsPerSecond: 6000000 } : undefined);
    const chunks = [];
    recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
    const recordingDone = new Promise((resolve, reject) => {
      recorder.onerror = () => reject(new Error('MediaRecorder failed'));
      recorder.onstop = () => resolve(new Blob(chunks, { type: recorder.mimeType || 'video/webm' }));
    });
    recorder.start(250);
    for (let frame = 0; frame < totalFrames; frame += 1) {
      const cut = Math.floor(frame / framesPerCut);
      drawPaper(context, width, height, keyword.value.trim(), cut * 7919 + keyword.value.length * 31, Number($('#zoom').value), Number($('#blur').value));
      if (audioDestination && frame % framesPerCut === 0) playTone(audioContext, audioDestination, sound);
      const percent = Math.max(1, Math.round(((frame + 1) / totalFrames) * 100));
      progressBar.style.width = `${percent}%`;
      progressPct.textContent = `${percent}%`;
      progressText.textContent = percent < 90 ? 'بنرسم القصّات…' : 'بنخلص اللمسات…';
      // setTimeout بدل requestAnimationFrame عشان الرندر مايتوقفش لو التبويب في الخلفية.
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    recorder.stop();
    const blob = await recordingDone;
    if (audioContext) await audioContext.close();
    if (lastUrl) URL.revokeObjectURL(lastUrl);
    lastUrl = URL.createObjectURL(blob);
    preview.src = lastUrl;
    const extension = blob.type.includes('mp4') ? 'mp4' : 'webm';
    download.href = lastUrl;
    download.download = `kelmetak-thabta-${Date.now()}.${extension}`;
    download.textContent = `نزّل ${extension.toUpperCase()} ←`;
    $('#resultNote').textContent = `الفيديو اتعمل على جهازك بصيغة ${extension.toUpperCase()} ومن غير علامة مائية.`;
    result.classList.remove('hidden');
    progressArea.classList.add('hidden');
  } catch (generationError) {
    console.error(generationError);
    progressArea.classList.add('hidden');
    validation.textContent = 'حصلت مشكلة وإحنا بنعمل الفيديو. جرّب Chrome أو Edge حديث، ولو لسه المشكلة موجودة جرّب تختار «من غير صوت». (' + generationError.message + ')';
  } finally {
    resetBusy();
  }
}

generate.addEventListener('click', () => { if (!busy) makeVideo(); });
$('#regenerate').addEventListener('click', () => { if (!busy) makeVideo(); });
