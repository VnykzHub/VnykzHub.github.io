---
id: multimodal
label: Multimodal
title: Images and the Documents That Aren't Text
slug: multimodal
icon: image
color: "#9B6BA8"
dek: When your retrieval corpus contains charts, tables and scanned PDFs, text extraction is silent sabotage. How vision-language models work, what they cost, and why document-aware parsing is not optional.
---

## Vision-Language Models

An image is a matrix of pixels. A language model expects tokens. The gap between them is the entire premise of vision-language models, and the cost of that translation decides whether multimodal RAG is tractable.

Vision transformers divide images into patches — typically 14×14 or 16×16 pixel squares — and project each patch into a token embedding, as if they were words. A 1024×1024 image at 16×16 patches yields 4,096 raw patches. Production vision-language models rarely bill raw patches, though — they tile, pool or downsample to a fixed token budget per image, which is why published per-image token costs sit far below the raw patch count. The gap between the two can be an order of magnitude, so the provider's own token calculation is the only figure worth planning against. The model then processes these image tokens and text tokens through the same attention layers, so an image can appear anywhere in the context and be reasoned over like any other semantic unit.

This costs money and latency. An image token is cheaper than a text token to compute (fewer gradient updates during training), but more expensive than a text token to *store* once you have the embedding. Embedding a page image for retrieval requires running the vision tower on every candidate before ranking — a second pass beyond the text retrieval that already happened. Reranking 50 candidate documents with their images means ~28,800 image tokens transiting your embedding model, versus 50 chunks of 100 text tokens each. The throughput difference is real, and compounds if your corpus is large.

What are vision-language models reliable at? **Description**: asking "what is in this image" and getting an accurate summary. **OCR-adjacent reading**: extracting text that appears in the image, with the caveat that small text (below roughly 8–10pt at screen resolution) degrades sharply. **Layout understanding**: identifying where objects are, how they relate spatially, what the general structure is. These tasks work because the model learned to ground language in visual features during pre-training.

What do they fail at? **Precise counting**: "how many objects" is often off by one or two, or worse. **Fine spatial relations**: sub-pixel measurements or determining whether one region is *exactly* 2cm to the left of another. **Small text reading**: anything rendered below 8pt is guesswork. **Chart value extraction**: reading the numerical value off a bar chart, line graph or scatter plot. These tasks require the model to have learned sub-pixel precision or symbol recognition across every font and chart library ever used — it has not.

The implication for document retrieval is sharp. You can use a vision-language model to describe what a page *shows*, and store that description alongside the page image for semantic search. You cannot use a vision-language model to reliably extract the data *from* the page. If your question is "What was the revenue in Q3 2024?", you need the actual number, not a best-guess from vision. Description is free; extraction is expensive and unreliable.

:::figure vlm-token-cost
An image (1024×1024) encoded as patches (16×16) yields ~4,096 patches, each projected to a token. A text document of similar visual area (a printed page) yields ~400 tokens. The vision tower processes image tokens at attention cost O(n²) in sequence length; the total scales with image count and retrieval width, making wide retrieval over large image collections expensive compared to text.
:::

The concrete tradeoff: embed page images for discovery ("show me pages about financial forecasts") but retrieve text for extraction ("give me the Q3 revenue number"). This is why hybrid approaches work. A vision-language model can summarise a page to a dense, searchable description — answering the *why* a page is relevant — but cannot reliably transcribe its data, which answers the *what*.

## Documents That Are Not Text

When a PDF contains a table with three columns and four rows, naive text extraction sees seven paragraphs. When a chart has a legend, axis labels and a series of coloured bars, text extraction sees a paragraph. The retrieval system then has to guess which of these seven paragraphs is actually *about* the table's content, whether the legend is metadata or a separate fact, and what the spatial relationship was that made the information coherent in the first place.

This is not a problem to solve by tweaking the embedding model. It is a problem baked into the assumption that "extract text, then chunk, then embed" preserves the meaning of the source.

Suppose you have a two-column financial report. Column one is narrative; column two is a table of values. Naive text extraction reads left-to-right, top-to-bottom, across the page boundary — so the narrative and the table interleave, destroying both. You retrieve a chunk that is half narrative and half table row, and the model tries to answer a question about table structure using garbled input. The answer will be quietly wrong, and you will debug the wrong thing (the embedding model, the reranker, the prompt) when the fault is upstream.

Your options are four:

| Approach | What it preserves | Cost | Fails when |
|---|---|---|---|
| Text extraction only | Paragraph and sentence boundaries | Cheapest; one pass | Any table, multi-column layout, or image-heavy page |
| Layout-aware parsing (pdfplumber, pymupdf) | Column order, table structure, text bounding boxes | Moderate; requires PDF library and geometry | PDFs with overlapping text boxes or missing structure (scans) |
| Page-as-image | All visual information; spatial relationships | High; image tokens are expensive; vision-language model needed for reading | Querying numeric data; precision extraction |
| Hybrid | All of the above; retrieval uses both modalities | Highest; dual-index, dual-embedding | Keeping embeddings coherent between text and image views |

**Text extraction only** is the default, and it fails silently. Tools like `PyPDF2` or `pdfminer` pull text in reading order and declare victory. Developers rarely inspect the output, because the task looks done. A page with a two-column layout comes back as interleaved paragraphs. A table comes back as a sequence of cell values with no column headers. A scanned PDF (image-based, no embedded text layer) comes back as nothing. The retrieval system then operates on data that is not just lossy — it is *corrupted*, systematically in ways no embedding model can recover.

**Layout-aware parsing** (pdfplumber, pymupdf) preserves structure. You can ask "what text is in the table at position (100, 200)?", recover column headers, and maintain the spatial relationships that made the page coherent. Cost is one or two extra passes through the PDF, plus some geometry arithmetic. It fails when the PDF is malformed — overlapping text boxes, missing coordinates, or scanned pages with no embedded text layer. Once you have structured output, you chunk on table boundaries, section headings and column breaks rather than fixed token counts. A table with 10 rows stays together as one retrievable unit; a narrative paragraph stays separate. Retrieval improves because the chunk is now semantically coherent and can be embedded as a meaningful whole.

:::code python
# Layout-aware chunking: preserve table structure and column boundaries
import pymupdf

doc = pymupdf.open("report.pdf")
chunks = []

for page_num, page in enumerate(doc):
    # Extract tables as atomic units with headers
    tables = page.find_tables()
    for table in tables:
        header = " | ".join(table.header)
        rows = [" | ".join(row) for row in table.rows]
        table_text = header + "\n" + "\n".join(rows)
        chunks.append({
            "text": table_text,
            "source": f"page_{page_num}_table",
            "bbox": table.bbox
        })
    
    # Extract narrative text between tables, skipping table regions
    text_blocks = page.get_text("blocks")
    for block in text_blocks:
        if is_text_block(block) and not overlaps_any_table(block, tables):
            chunks.append({
                "text": block["text"],
                "source": f"page_{page_num}_text",
                "bbox": block["bbox"]
            })
:::

**Page-as-image** treats the entire page as a visual unit. You embed the image, retrieve by visual similarity, and send the image to a vision-language model for reading. This preserves *all* spatial information — layout, colours, typography, charts — but costs ~500 tokens per page versus ~100 for extracted text. Retrieval becomes expensive if your corpus is large. More critically, you cannot reliably extract numeric data from charts, because vision-language models hallucinate numbers. A page with a bar chart showing revenue by quarter will come back with plausible-sounding values that are wrong. This works well for "find me pages that look like financial reports" but breaks for "give me Q3 2024 revenue".

**Hybrid** combines approaches: extract and embed text for retrieval; also embed page images for visual discovery; when the model needs to read data from a chart or table, send the image region to a vision-language model. This is expensive — two embeddings per page, image token overhead, a vision-language model call in the generation loop — but it wins back precision. You can retrieve on text semantic similarity, then fall back to visual reasoning only for the specific data points that text extraction lost.

The choice hinges on what your corpus contains and what questions you must answer. A corpus of narrative reports (earnings call transcripts, research papers) benefits most from layout-aware parsing: structure matters, but data extraction is secondary. A corpus heavy in tables and charts (financial reports, scientific papers with figures) needs hybrid. A corpus of scanned documents (old contracts, PDFs without embedded text layers) may need page-as-image as a baseline because layout-aware parsing cannot see text that was never encoded.

All of this assumes you want retrieval to work at all. Once you have retrieved candidates, the retrieval unit itself changes meaning. A table is no longer "five paragraphs split at token boundaries". It is "the table on page 3, rows 2–6, columns A–C". A figure is "the chart below the heading 'Revenue Trends'", not "1200 tokens of extracted text with axis labels mixed into the legend".

Citations now point to page regions, not chunks. Your storage needs to record not just the text or image, but the bounding box, the page number, and enough context to reconstruct what the original document showed. When the model cites a figure, the user can click and see the actual chart. When it cites a table row, the citation shows the original column headers and the spatial context. This is where retrieval-augmented generation meets real usability: the answer is only as good as the source you can show.

Embedding strategy shifts too. If you embed extracted table text, you lose spatial queries ("find me tables with revenue in column 2 and year in column 1"). If you embed the table image, you lose keyword search ("find tables mentioning 'GAAP'"). The semantic space for images and text does not align perfectly — an image of a table and the extracted text of that table have different nearest neighbours in embedding space. This is not because the embedding model is weak; it is because images and text encode different information. The image shows layout; the text shows content. Neither alone is sufficient.

The practical default: extract text with layout awareness; embed text for retrieval; store page images and bounding boxes; only call a vision-language model when retrieval fails or the question explicitly asks for visual reasoning. This keeps cost reasonable whilst preserving the signal to recover precise answers when the source is ambiguous or when structure is the question.
