-- Create test audience with 100 contacts
-- This script will create a test audience and insert sample data

-- First, let's create a test account if it doesn't exist
INSERT INTO public.accounts (id, name, is_personal_account, created_at, updated_at)
VALUES (
  '5b006b9f-e7b0-4a22-a915-cb60e26ce78e',
  'Test Account',
  false,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create a test audience
INSERT INTO public.audience (id, name, account_id, created_at, updated_at, deleted)
VALUES (
  'b66be1f9-33da-45e9-bfdf-360872f1a5ad',
  'Test AI Companies Audience',
  '5b006b9f-e7b0-4a22-a915-cb60e26ce78e',
  NOW(),
  NOW(),
  false
) ON CONFLICT (id) DO NOTHING;

-- Verify the audience was created
SELECT 
  a.id as audience_id,
  a.name as audience_name,
  a.account_id,
  a.created_at
FROM public.audience a
WHERE a.id = 'b66be1f9-33da-45e9-bfdf-360872f1a5ad';

-- Create test audience data (100 contacts)
-- This simulates the raw data that would be stored in GCS
WITH test_data AS (
  SELECT 
    'perplexity.ai' as domain,
    'Perplexity' as enrich_company,
    'https://linkedin.com/company/perplexity-ai' as url
  UNION ALL SELECT 'databricks.com', 'Databricks', 'https://linkedin.com/company/databricks'
  UNION ALL SELECT 'openai.com', 'OpenAI', 'https://linkedin.com/company/openai'
  UNION ALL SELECT 'anthropic.com', 'Anthropic', 'https://linkedin.com/company/anthropic-ai'
  UNION ALL SELECT 'cohere.ai', 'Cohere', 'https://linkedin.com/company/cohere-ai'
  UNION ALL SELECT 'huggingface.co', 'Hugging Face', 'https://linkedin.com/company/huggingface'
  UNION ALL SELECT 'stability.ai', 'Stability AI', 'https://linkedin.com/company/stability-ai'
  UNION ALL SELECT 'midjourney.com', 'Midjourney', 'https://linkedin.com/company/midjourney'
  UNION ALL SELECT 'runwayml.com', 'Runway', 'https://linkedin.com/company/runwayml'
  UNION ALL SELECT 'replicate.com', 'Replicate', 'https://linkedin.com/company/replicate-ai'
  UNION ALL SELECT 'scale.com', 'Scale AI', 'https://linkedin.com/company/scale-ai'
  UNION ALL SELECT 'tome.app', 'Tome', 'https://linkedin.com/company/tome-app'
  UNION ALL SELECT 'notion.so', 'Notion', 'https://linkedin.com/company/notion-so'
  UNION ALL SELECT 'figma.com', 'Figma', 'https://linkedin.com/company/figma'
  UNION ALL SELECT 'canva.com', 'Canva', 'https://linkedin.com/company/canva'
  UNION ALL SELECT 'slack.com', 'Slack', 'https://linkedin.com/company/slack'
  UNION ALL SELECT 'discord.com', 'Discord', 'https://linkedin.com/company/discord'
  UNION ALL SELECT 'zoom.us', 'Zoom', 'https://linkedin.com/company/zoom-video-communications'
  UNION ALL SELECT 'teams.microsoft.com', 'Microsoft Teams', 'https://linkedin.com/company/microsoft'
  UNION ALL SELECT 'asana.com', 'Asana', 'https://linkedin.com/company/asana'
  UNION ALL SELECT 'trello.com', 'Trello', 'https://linkedin.com/company/trello'
  UNION ALL SELECT 'monday.com', 'Monday.com', 'https://linkedin.com/company/monday-com'
  UNION ALL SELECT 'clickup.com', 'ClickUp', 'https://linkedin.com/company/clickup'
  UNION ALL SELECT 'airtable.com', 'Airtable', 'https://linkedin.com/company/airtable'
  UNION ALL SELECT 'notion.so', 'Notion', 'https://linkedin.com/company/notion-so'
  UNION ALL SELECT 'roamresearch.com', 'Roam Research', 'https://linkedin.com/company/roam-research'
  UNION ALL SELECT 'obsidian.md', 'Obsidian', 'https://linkedin.com/company/obsidian'
  UNION ALL SELECT 'logseq.com', 'Logseq', 'https://linkedin.com/company/logseq'
  UNION ALL SELECT 'craft.do', 'Craft', 'https://linkedin.com/company/craft-do'
  UNION ALL SELECT 'bear.app', 'Bear', 'https://linkedin.com/company/bear-app'
  UNION ALL SELECT 'ulysses.app', 'Ulysses', 'https://linkedin.com/company/ulysses'
  UNION ALL SELECT 'scrivener.com', 'Scrivener', 'https://linkedin.com/company/scrivener'
  UNION ALL SELECT 'grammarly.com', 'Grammarly', 'https://linkedin.com/company/grammarly'
  UNION ALL SELECT 'hemingwayapp.com', 'Hemingway Editor', 'https://linkedin.com/company/hemingway-editor'
  UNION ALL SELECT 'prowritingaid.com', 'ProWritingAid', 'https://linkedin.com/company/prowritingaid'
  UNION ALL SELECT 'ginger.com', 'Ginger', 'https://linkedin.com/company/ginger-software'
  UNION ALL SELECT 'whitesmoke.com', 'WhiteSmoke', 'https://linkedin.com/company/whitesmoke'
  UNION ALL SELECT 'languagetool.org', 'LanguageTool', 'https://linkedin.com/company/languagetool'
  UNION ALL SELECT 'slickwrite.com', 'Slick Write', 'https://linkedin.com/company/slickwrite'
  UNION ALL SELECT 'paperrater.com', 'PaperRater', 'https://linkedin.com/company/paperrater'
  UNION ALL SELECT 'readable.com', 'Readable', 'https://linkedin.com/company/readable'
  UNION ALL SELECT 'copyscape.com', 'Copyscape', 'https://linkedin.com/company/copyscape'
  UNION ALL SELECT 'plagiarismchecker.com', 'Plagiarism Checker', 'https://linkedin.com/company/plagiarism-checker'
  UNION ALL SELECT 'turnitin.com', 'Turnitin', 'https://linkedin.com/company/turnitin'
  UNION ALL SELECT 'grammarly.com', 'Grammarly', 'https://linkedin.com/company/grammarly'
  UNION ALL SELECT 'hemingwayapp.com', 'Hemingway Editor', 'https://linkedin.com/company/hemingway-editor'
  UNION ALL SELECT 'prowritingaid.com', 'ProWritingAid', 'https://linkedin.com/company/prowritingaid'
  UNION ALL SELECT 'ginger.com', 'Ginger', 'https://linkedin.com/company/ginger-software'
  UNION ALL SELECT 'whitesmoke.com', 'WhiteSmoke', 'https://linkedin.com/company/whitesmoke'
  UNION ALL SELECT 'languagetool.org', 'LanguageTool', 'https://linkedin.com/company/languagetool'
  UNION ALL SELECT 'slickwrite.com', 'Slick Write', 'https://linkedin.com/company/slickwrite'
  UNION ALL SELECT 'paperrater.com', 'PaperRater', 'https://linkedin.com/company/paperrater'
  UNION ALL SELECT 'readable.com', 'Readable', 'https://linkedin.com/company/readable'
  UNION ALL SELECT 'copyscape.com', 'Copyscape', 'https://linkedin.com/company/copyscape'
  UNION ALL SELECT 'plagiarismchecker.com', 'Plagiarism Checker', 'https://linkedin.com/company/plagiarism-checker'
  UNION ALL SELECT 'turnitin.com', 'Turnitin', 'https://linkedin.com/company/turnitin'
  UNION ALL SELECT 'chatgpt.com', 'ChatGPT', 'https://linkedin.com/company/openai'
  UNION ALL SELECT 'bard.google.com', 'Google Bard', 'https://linkedin.com/company/google'
  UNION ALL SELECT 'claude.ai', 'Claude', 'https://linkedin.com/company/anthropic-ai'
  UNION ALL SELECT 'bing.com/chat', 'Bing Chat', 'https://linkedin.com/company/microsoft'
  UNION ALL SELECT 'duckduckgo.com', 'DuckDuckGo', 'https://linkedin.com/company/duckduckgo'
  UNION ALL SELECT 'brave.com', 'Brave', 'https://linkedin.com/company/brave-software'
  UNION ALL SELECT 'firefox.com', 'Firefox', 'https://linkedin.com/company/mozilla'
  UNION ALL SELECT 'chrome.google.com', 'Chrome', 'https://linkedin.com/company/google'
  UNION ALL SELECT 'safari.apple.com', 'Safari', 'https://linkedin.com/company/apple'
  UNION ALL SELECT 'edge.microsoft.com', 'Edge', 'https://linkedin.com/company/microsoft'
  UNION ALL SELECT 'opera.com', 'Opera', 'https://linkedin.com/company/opera-software'
  UNION ALL SELECT 'vivaldi.com', 'Vivaldi', 'https://linkedin.com/company/vivaldi-technologies'
  UNION ALL SELECT 'maxthon.com', 'Maxthon', 'https://linkedin.com/company/maxthon'
  UNION ALL SELECT 'sleipnir.com', 'Sleipnir', 'https://linkedin.com/company/fenrir-inc'
  UNION ALL SELECT 'yandex.com', 'Yandex', 'https://linkedin.com/company/yandex'
  UNION ALL SELECT 'baidu.com', 'Baidu', 'https://linkedin.com/company/baidu'
  UNION ALL SELECT 'sogou.com', 'Sogou', 'https://linkedin.com/company/sogou'
  UNION ALL SELECT '360.cn', '360 Browser', 'https://linkedin.com/company/360-security'
  UNION ALL SELECT 'qq.com', 'QQ Browser', 'https://linkedin.com/company/tencent'
  UNION ALL SELECT 'ucweb.com', 'UC Browser', 'https://linkedin.com/company/ucweb'
  UNION ALL SELECT 'samsung.com', 'Samsung Internet', 'https://linkedin.com/company/samsung'
  UNION ALL SELECT 'huawei.com', 'Huawei Browser', 'https://linkedin.com/company/huawei'
  UNION ALL SELECT 'xiaomi.com', 'Mi Browser', 'https://linkedin.com/company/xiaomi'
  UNION ALL SELECT 'oppo.com', 'OPPO Browser', 'https://linkedin.com/company/oppo'
  UNION ALL SELECT 'vivo.com', 'vivo Browser', 'https://linkedin.com/company/vivo'
  UNION ALL SELECT 'oneplus.com', 'OnePlus Browser', 'https://linkedin.com/company/oneplus'
  UNION ALL SELECT 'realme.com', 'realme Browser', 'https://linkedin.com/company/realme'
  UNION ALL SELECT 'honor.com', 'Honor Browser', 'https://linkedin.com/company/honor'
  UNION ALL SELECT 'nokia.com', 'Nokia Browser', 'https://linkedin.com/company/nokia'
  UNION ALL SELECT 'motorola.com', 'Motorola Browser', 'https://linkedin.com/company/motorola'
  UNION ALL SELECT 'lg.com', 'LG Browser', 'https://linkedin.com/company/lg-electronics'
  UNION ALL SELECT 'sony.com', 'Sony Browser', 'https://linkedin.com/company/sony'
  UNION ALL SELECT 'asus.com', 'ASUS Browser', 'https://linkedin.com/company/asus'
  UNION ALL SELECT 'acer.com', 'Acer Browser', 'https://linkedin.com/company/acer'
  UNION ALL SELECT 'lenovo.com', 'Lenovo Browser', 'https://linkedin.com/company/lenovo'
  UNION ALL SELECT 'dell.com', 'Dell Browser', 'https://linkedin.com/company/dell'
  UNION ALL SELECT 'hp.com', 'HP Browser', 'https://linkedin.com/company/hp'
  UNION ALL SELECT 'toshiba.com', 'Toshiba Browser', 'https://linkedin.com/company/toshiba'
  UNION ALL SELECT 'fujitsu.com', 'Fujitsu Browser', 'https://linkedin.com/company/fujitsu'
  UNION ALL SELECT 'panasonic.com', 'Panasonic Browser', 'https://linkedin.com/company/panasonic'
  UNION ALL SELECT 'sharp.com', 'Sharp Browser', 'https://linkedin.com/company/sharp'
  UNION ALL SELECT 'canon.com', 'Canon Browser', 'https://linkedin.com/company/canon'
  UNION ALL SELECT 'nikon.com', 'Nikon Browser', 'https://linkedin.com/company/nikon'
  UNION ALL SELECT 'sony.com', 'Sony Camera', 'https://linkedin.com/company/sony'
  UNION ALL SELECT 'gopro.com', 'GoPro', 'https://linkedin.com/company/gopro'
  UNION ALL SELECT 'dji.com', 'DJI', 'https://linkedin.com/company/dji'
  UNION ALL SELECT 'parrot.com', 'Parrot', 'https://linkedin.com/company/parrot'
  UNION ALL SELECT 'autel.com', 'Autel', 'https://linkedin.com/company/autel'
  UNION ALL SELECT 'skydio.com', 'Skydio', 'https://linkedin.com/company/skydio'
  UNION ALL SELECT 'yuneec.com', 'Yuneec', 'https://linkedin.com/company/yuneec'
  UNION ALL SELECT 'hubsan.com', 'Hubsan', 'https://linkedin.com/company/hubsan'
  UNION ALL SELECT 'syma.com', 'Syma', 'https://linkedin.com/company/syma'
  UNION ALL SELECT 'udrone.com', 'UDI RC', 'https://linkedin.com/company/udirc'
  UNION ALL SELECT 'holy-stone.com', 'Holy Stone', 'https://linkedin.com/company/holy-stone'
  UNION ALL SELECT 'potensic.com', 'Potensic', 'https://linkedin.com/company/potensic'
  UNION ALL SELECT 'snaptain.com', 'Snaptain', 'https://linkedin.com/company/snaptain'
  UNION ALL SELECT 'force1.com', 'Force1', 'https://linkedin.com/company/force1'
  UNION ALL SELECT 'altair.com', 'Altair Aerial', 'https://linkedin.com/company/altair-aerial'
  UNION ALL SELECT 'tello.com', 'Tello', 'https://linkedin.com/company/tello'
  UNION ALL SELECT 'ryze.com', 'Ryze', 'https://linkedin.com/company/ryze'
  UNION ALL SELECT 'skydio.com', 'Skydio', 'https://linkedin.com/company/skydio'
  UNION ALL SELECT 'autel.com', 'Autel', 'https://linkedin.com/company/autel'
  UNION ALL SELECT 'parrot.com', 'Parrot', 'https://linkedin.com/company/parrot'
  UNION ALL SELECT 'dji.com', 'DJI', 'https://linkedin.com/company/dji'
  UNION ALL SELECT 'gopro.com', 'GoPro', 'https://linkedin.com/company/gopro'
  UNION ALL SELECT 'sony.com', 'Sony', 'https://linkedin.com/company/sony'
  UNION ALL SELECT 'canon.com', 'Canon', 'https://linkedin.com/company/canon'
  UNION ALL SELECT 'nikon.com', 'Nikon', 'https://linkedin.com/company/nikon'
  UNION ALL SELECT 'fujifilm.com', 'Fujifilm', 'https://linkedin.com/company/fujifilm'
  UNION ALL SELECT 'leica.com', 'Leica', 'https://linkedin.com/company/leica'
  UNION ALL SELECT 'hasselblad.com', 'Hasselblad', 'https://linkedin.com/company/hasselblad'
  UNION ALL SELECT 'phaseone.com', 'Phase One', 'https://linkedin.com/company/phase-one'
  UNION ALL SELECT 'mamiya.com', 'Mamiya', 'https://linkedin.com/company/mamiya'
  UNION ALL SELECT 'pentax.com', 'Pentax', 'https://linkedin.com/company/pentax'
  UNION ALL SELECT 'olympus.com', 'Olympus', 'https://linkedin.com/company/olympus'
  UNION ALL SELECT 'panasonic.com', 'Panasonic', 'https://linkedin.com/company/panasonic'
  UNION ALL SELECT 'samsung.com', 'Samsung', 'https://linkedin.com/company/samsung'
  UNION ALL SELECT 'lg.com', 'LG', 'https://linkedin.com/company/lg-electronics'
  UNION ALL SELECT 'sharp.com', 'Sharp', 'https://linkedin.com/company/sharp'
  UNION ALL SELECT 'toshiba.com', 'Toshiba', 'https://linkedin.com/company/toshiba'
  UNION ALL SELECT 'hitachi.com', 'Hitachi', 'https://linkedin.com/company/hitachi'
  UNION ALL SELECT 'mitsubishi.com', 'Mitsubishi', 'https://linkedin.com/company/mitsubishi'
  UNION ALL SELECT 'fujitsu.com', 'Fujitsu', 'https://linkedin.com/company/fujitsu'
  UNION ALL SELECT 'nec.com', 'NEC', 'https://linkedin.com/company/nec'
  UNION ALL SELECT 'ricoh.com', 'Ricoh', 'https://linkedin.com/company/ricoh'
  UNION ALL SELECT 'brother.com', 'Brother', 'https://linkedin.com/company/brother'
  UNION ALL SELECT 'epson.com', 'Epson', 'https://linkedin.com/company/epson'
  UNION ALL SELECT 'hp.com', 'HP', 'https://linkedin.com/company/hp'
  UNION ALL SELECT 'canon.com', 'Canon', 'https://linkedin.com/company/canon'
  UNION ALL SELECT 'xerox.com', 'Xerox', 'https://linkedin.com/company/xerox'
  UNION ALL SELECT 'lexmark.com', 'Lexmark', 'https://linkedin.com/company/lexmark'
  UNION ALL SELECT 'kyocera.com', 'Kyocera', 'https://linkedin.com/company/kyocera'
  UNION ALL SELECT 'okidata.com', 'OKI', 'https://linkedin.com/company/oki'
  UNION ALL SELECT 'samsung.com', 'Samsung', 'https://linkedin.com/company/samsung'
  UNION ALL SELECT 'dell.com', 'Dell', 'https://linkedin.com/company/dell'
  UNION ALL SELECT 'lenovo.com', 'Lenovo', 'https://linkedin.com/company/lenovo'
  UNION ALL SELECT 'acer.com', 'Acer', 'https://linkedin.com/company/acer'
  UNION ALL SELECT 'asus.com', 'ASUS', 'https://linkedin.com/company/asus'
  UNION ALL SELECT 'msi.com', 'MSI', 'https://linkedin.com/company/msi'
  UNION ALL SELECT 'gigabyte.com', 'Gigabyte', 'https://linkedin.com/company/gigabyte'
  UNION ALL SELECT 'asus.com', 'ASUS', 'https://linkedin.com/company/asus'
  UNION ALL SELECT 'msi.com', 'MSI', 'https://linkedin.com/company/msi'
  UNION ALL SELECT 'gigabyte.com', 'Gigabyte', 'https://linkedin.com/company/gigabyte'
  UNION ALL SELECT 'asus.com', 'ASUS', 'https://linkedin.com/company/asus'
  UNION ALL SELECT 'msi.com', 'MSI', 'https://linkedin.com/company/msi'
  UNION ALL SELECT 'gigabyte.com', 'Gigabyte', 'https://linkedin.com/company/gigabyte'
)
SELECT * FROM test_data LIMIT 100; 