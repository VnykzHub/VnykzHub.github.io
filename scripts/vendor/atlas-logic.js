// ─── STATE ────────────────────────────────────────────────────────────
let activeSection='foundations',searchQ='',dlMode='full',dlSections,expandedCards=new Set();

// ─── SECTIONS DATA ───────────────────────────────────────────────────
const SECTIONS=[
  {
    id: "attn-variants",
    label: "Attention Variations",
    title: "The Evolution of Attention",
    color: "#FF6B6B",
    icon: "🔀",
    subs: [
      {
        id: "causal_attn",
        title: "1. The \"Looking Forward\" Change (Causal / Masked Attention)",
        body: "**Used in:** GPT, Llama, Mistral (decoder-only models).\n\n**The Math Change:** Before the Softmax step, we add a mask (a matrix of negative infinity) to the top-right half of the scores.\n\n**Simple Explanation:** When predicting the next word, the model is forbidden from \"peeking\" at future words. The math forces the percentages for any future token to become exactly **0%**. It only pays attention to the words that came *before* the current one.",
        anim: "anim_causal_mask",
        math: {
          eqs: [
            {
              l: "Causal Masked Attention",
              t: "\\text{Attention}(Q,K,V) = \\text{Softmax}\\left(\\frac{QK^T + M}{\\sqrt{d_k}}\\right)V"
            }
          ]
        }
      },
      {
        id: "mha_revisited",
        title: "2. The \"Multiple Perspectives\" Change (Multi-Head Attention)",
        body: "**Used in:** Original Transformer, early GPTs.\n\n**The Math Change:** Instead of doing the core formula once, we split Q, K, and V into multiple smaller chunks (heads). We run the exact same formula independently on each chunk, then glue (concatenate) the results together.\n\n**Simple Explanation:** One head might focus on grammar (verbs/objects), while another focuses on pronouns, and another focuses on context. Running the math in parallel lets the model capture different \"relationships\" at the same time.",
        anim: "anim_mha_split",
        math: {
          eqs: [
            {
              l: "Multi-Head Attention",
              t: "\\text{MHA}(Q,K,V) = \\text{Concat}(\\text{head}_1, \\dots, \\text{head}_h)W^O"
            }
          ]
        }
      },
      {
        id: "gqa_attn",
        title: "3. The \"Memory Saver\" Change (Multi-Query & GQA)",
        body: "**Used in:** Llama 2/3, PaLM.\n\n**The Math Change:** Instead of having unique K and V for every attention head, multiple Q heads are forced to share the *same* K and V.\n\n**Simple Explanation:** The math stays identical, but we dramatically shrink the size of the K and V matrices. This means the model uses far less memory when generating text, allowing it to run much faster, at a tiny cost to its \"focus\" diversity.",
        anim: "anim_gqa",
        math: {
          eqs: [
            {
              l: "Grouped-Query sharing",
              t: "K_i = K_{\\lfloor i/g \\rfloor}, \\quad V_i = V_{\\lfloor i/g \\rfloor}"
            }
          ]
        }
      },
      {
        id: "cross_attn",
        title: "4. The \"Cross-Modal\" Change (Cross-Attention)",
        body: "**Used in:** Image-to-text models, translation (old Transformers), stable diffusion.\n\n**The Math Change:** The **Q** comes from one source (e.g., the text you are generating), but the **K** and **V** come from a completely different source (e.g., the image pixels or the foreign-language sentence).\n\n**Simple Explanation:** You are asking a question (Q) about a specific database of facts (K, V). The math doesn't change, but *where the numbers come from* changes entirely. It lets a model read a document and answer questions about it.",
        anim: "anim_cross_attn",
        math: {
          eqs: [
            {
              l: "Cross-Attention",
              t: "\\text{Attention}(Q_{text}, K_{image}, V_{image})"
            }
          ]
        }
      },
      {
        id: "sparse_attn",
        title: "5. The \"Sparse\" Change (Sliding Window & Global)",
        body: "**Used in:** Longformer, Mistral 7B, BigBird.\n\n**The Math Change:** Instead of calculating $QK^T$ for *every single token* in a 10,000-word document (which is mathematically $O(n^2)$ and impossibly slow), we force the scores for far-away tokens to be zero. We only calculate the dot product for local neighbors (sliding window) and a few special \"global\" tokens.\n\n**Simple Explanation:** Instead of comparing every word to every other word (which is math-heavy), we tell the model: \"Only look at the words right next to you, plus a few main topic words.\" The math is the same, but we skip 95% of the calculations to handle huge documents.",
        anim: "anim_sparse_window",
        math: {
          eqs: [
            {
              l: "Sparse Complexity",
              t: "O(n \\times w) \\ll O(n^2)"
            }
          ]
        }
      },
      {
        id: "linear_attn",
        title: "6. The \"Order of Operations\" Change (Linear/Kernel)",
        body: "**Used in:** Performer, RWKV (partially), some efficient models.\n\n**The Math Change:** This is a *big* math trick. Normally, you do $(Q \\times K^T) \\times V$. Mathematically, this forces you to build a massive matrix. Linear attention uses a math property called the **kernel trick**. It replaces the dot-product with a special function (like $\\text{elu}(x)+1$) so that you can rewrite the math as $Q \\times (K^T \\times V)$.\n\n**Simple Explanation:** By changing the order you multiply the numbers, you never have to build the giant \"similarity matrix.\" This drops the math workload from $O(n^2)$ down to $O(n)$ (linear). The trade-off is that it loses some precision on very long sequences, but it is lightning-fast.",
        anim: "anim_linear_kernel",
        math: {
          eqs: [
            {
              l: "Associativity Trick",
              t: "(Q K^T) V \\rightarrow Q (K^T V)"
            }
          ]
        }
      },
      {
        id: "flash_attn",
        title: "7. The \"Hardware\" Change (Flash Attention)",
        body: "**Used in:** Almost *every* modern model (GPT-4, Llama 3, Mistral).\n\n**The Math Change:** **Here is the secret: Flash Attention does NOT change the math formula at all.** It calculates $\\text{Softmax}(QK^T)V$ to the exact decimal as the original formula.\n\n**Simple Explanation:** Instead of calculating all the scores, writing them to temporary memory, reading them back, and then doing Softmax, Flash Attention does the math in tiny overlapping chunks (tiling) directly inside the GPU's super-fast cache memory (SRAM). It uses smart math (online softmax) to stitch these chunks together. The result is the *exact same answer*, but it runs 2x–10x faster and uses far less memory.",
        anim: "anim_flash_tiling",
        math: {
          eqs: [
            {
              l: "Tiling & Online Softmax",
              t: "\\tilde{m}_{ij} = \\max(m_i, m_j), \\quad \\tilde{l}_{ij} = e^{m_i - \\tilde{m}_{ij}}l_i + e^{m_j - \\tilde{m}_{ij}}l_j"
            }
          ]
        }
      }
    ]
  },
  {
    id: "math-primer",
    label: "Math Basics",
    color: "#F7B731",
    subs: [
      {
        id: "math-vectors",
        title: "Vectors and Matrices",
        body: "A vector is an array of numbers, representing a point or direction in space. LLMs represent everything—words, images, concepts—as high-dimensional vectors (e.g., 4096 dimensions). A matrix is a 2D grid of numbers that transforms these vectors. When a token passes through a Transformer layer, it is repeatedly multiplied by matrices (weights) to update its meaning.",
        math: {
          eqs: [
            {
              l: "Vector",
              t: "\\\\mathbf{v} = [v_1, v_2, ..., v_d] \\\\in \\\\mathbb{R}^d"
            },
            {
              l: "Matrix Multiplication",
              t: "\\\\mathbf{y} = \\\\mathbf{W}\\\\mathbf{x} + \\\\mathbf{b}"
            }
          ]
        }
      },
      {
        id: "math-dot-product",
        title: "Dot Product (Similarity)",
        body: "The dot product measures how aligned two vectors are. In attention mechanisms, we compute the dot product between a \"query\" vector (what a word is looking for) and a \"key\" vector (what another word offers). A higher dot product means the words are more relevant to each other in context.",
        math: {
          eqs: [
            {
              l: "Dot Product",
              t: "\\\\mathbf{q} \\\\cdot \\\\mathbf{k} = \\\\sum_{i=1}^{d} q_i k_i = ||\\\\mathbf{q}|| ||\\\\mathbf{k}|| \\\\cos(\\\\theta)"
            }
          ]
        }
      },
      {
        id: "math-softmax",
        title: "Softmax Function",
        body: "The softmax function takes a list of raw scores (logits) and squashes them into probabilities that sum to 1. In LLMs, it is used twice: first in the attention mechanism to determine how much \"weight\" to give each surrounding word, and second at the very end to output the probability of the next token.",
        math: {
          eqs: [
            {
              l: "Softmax",
              t: "\\\\text{Softmax}(x_i) = \\\\frac{e^{x_i}}{\\\\sum_j e^{x_j}}"
            }
          ]
        }
      },
      {
        id: "math-gradients",
        title: "Gradients and Derivatives",
        body: "A derivative measures how much the output of a function changes if you slightly tweak the input. A gradient is simply a vector of derivatives for multiple variables. During training, backpropagation computes the gradient of the loss with respect to every single parameter, telling the optimizer exactly how to adjust the weights to improve the model.",
        math: {
          eqs: [
            {
              l: "Gradient Update",
              t: "\\\\theta_{new} = \\\\theta_{old} - \\\\eta \\\\nabla_{\\\\theta} L(\\\\theta)"
            }
          ]
        }
      }
    ],
    title: "Math Primer",
    icon: "🧮"
  },
  {
    id: "foundations",
    label: "01 — Foundations",
    title: "What Is a Language Model?",
    color: "#6C63FF",
    icon: "📐",
    subs: [
      {
        id: "lm",
        title: "Language Model",
        body: "A language model is a system that assigns probabilities to sequences of tokens. Given some text so far, it predicts what comes next — formally learning P(next token | previous tokens).\n\nIf you have ever used phone keyboard autocomplete, you have used a language model. The 'knowledge' is statistical: the model has seen enormous amounts of text and learned which continuations tend to follow which inputs. It does not reason in the human sense; it interpolates over patterns.",
        anim: "token_pred",
        math: {
          eqs: [
            {
              l: "Chain Rule of Probability",
              t: "P(w_1,...,w_n) = \\prod_i P(w_i | w_1,...,w_{i-1})"
            }
          ]
        }
      },
      {
        id: "llm",
        title: "Large Language Model",
        body: "'Large' refers chiefly to the number of parameters (the tunable numbers inside the model — think of them as adjustable knobs) and the volume of training data.\n\nA small language model might have millions of parameters; an LLM has billions to over a trillion. GPT-1 (2018) had 117 million; GPT-3 (2020) had 175 billion — a 1500× jump in two years.\n\nBeyond certain thresholds, qualitatively new behaviors appear ('emergent abilities') — such as solving math problems or writing code that were never explicitly trained. This threshold effect is still debated and not fully understood.",
        anim: "param_scale",
        math: {
          eqs: [
            {
              l: "Parameter Space",
              t: "\\theta \\in \\mathbb{R}^N, \\, N \\approx 10^9 \\text{ to } 10^{12}"
            }
          ]
        }
      },
      {
        id: "phases",
        title: "Pre-training → Fine-tuning → Inference",
        body: "Pre-training: the massive, expensive first phase where the model learns general language patterns from a huge corpus — trillions of tokens. Virtually all the model's 'knowledge' is acquired here. A single pre-training run for a frontier model can cost tens of millions of dollars.\n\nFine-tuning: a smaller, cheaper later phase that adapts the pre-trained model to specific behaviors — e.g., following instructions (SFT), being helpful and harmless (RLHF/DPO), or answering in a specific domain.\n\nInference: using the trained model to produce outputs for users. No learning happens; parameters are frozen. The cost is per generated token, paid every time someone uses the model.",
        anim: "phases",
        math: {
          eqs: [
            {
              l: "1. Pre-training",
              t: "L_{PT} = -\\log P(x_t | x_{<t})"
            },
            {
              l: "2. SFT",
              t: "L_{SFT} = -\\sum_{t} \\log P(y_t | x, y_{<t})"
            },
            {
              l: "3. RLHF",
              t: "\\max_\\pi \\mathbb{E}[R(x, y)] - \\beta D_{KL}(\\pi || \\pi_{ref})"
            }
          ]
        }
      },
      {
        id: "misconceptions",
        title: "Common Misconceptions",
        body: "• 'LLM = ChatGPT' — ChatGPT is one product built on top of GPT-series LLMs plus fine-tuning and a chat interface. LLMs are a broad class of models from many organizations.\n\n• 'Transformer = LLM' — The Transformer is an architecture; an LLM is a large model trained on language. Vision Transformers exist and are not LLMs. An LLM could in principle use a non-Transformer architecture (Mamba-based models exist).\n\n• 'More parameters = better' — Chinchilla (2022) showed many large models were badly under-trained. A 70B model trained on 1.4T tokens can beat a 175B model trained on only 300B tokens.\n\n• 'Context window = usable context' — RULER (2024) showed models claiming 128K context windows often fail functionally at 32K on multi-hop retrieval tasks.",
        anim: null,
        math: null
      },
      {
        id: "vectors",
        title: "Vectors & Dot Products",
        body: "At their core, neural networks process numbers, not text. A vector is a list of numbers representing a point in high-dimensional space. Words are converted into 'embeddings' — vectors where semantic similarity correlates with geometric proximity.\n\nThe dot product measures similarity: it's the projection of one vector onto another. A high positive dot product means the vectors point in similar directions (similar meaning), while near-zero means they are orthogonal (unrelated). This simple operation is the mathematical engine behind attention and embeddings.",
        anim: null,
        math: {
          eqs: [
            {
              l: "Dot Product",
              t: "\\mathbf{u} \\cdot \\mathbf{v} = \\sum_{i=1}^n u_i v_i = |\\mathbf{u}| |\\mathbf{v}| \\cos\\theta"
            }
          ]
        }
      },
      {
        id: "grad_desc",
        title: "Gradient Descent & Backpropagation",
        body: "How do models learn? Imagine standing on a foggy mountain and wanting to reach the valley (minimum error). Gradient descent means taking a step in the direction of the steepest downward slope.\n\nBackpropagation calculates this slope efficiently. It applies the chain rule of calculus backwards through the network layers to assign 'blame' for the final error to every single parameter, allowing the model to update billions of weights simultaneously.",
        anim: null,
        math: {
          eqs: [
            {
              l: "Weight Update",
              t: "W \\leftarrow W - \\eta \\frac{\\partial L}{\\partial W}"
            }
          ]
        }
      },
      {
        id: "neuron",
        title: "Neurons & Layers",
        body: "A single artificial neuron takes multiple inputs, multiplies each by a learned weight, sums them up, and applies a non-linear activation function. It acts as a pattern detector.\n\nA layer is a collection of these neurons acting in parallel. Deep learning stacks these layers: early layers detect simple features (like word frequency), while deeper layers compose them into complex concepts (like sarcasm or logical entailment).",
        anim: null,
        math: {
          eqs: [
            {
              l: "Neuron output",
              t: "y = \\sigma\\left(\\sum_{i=1}^n w_i x_i + b\\right)"
            }
          ]
        }
      },
      {
        id: "sampling",
        title: "Temperature & Sampling",
        body: "Language models output a probability distribution over the entire vocabulary for the next token. How do we pick one?\n\nGreedy decoding always picks the most likely token, which can lead to repetitive, robotic text.\nSampling picks randomly according to the probabilities. Temperature (T) scales these probabilities: T=1 is the original distribution. T < 1 makes the model more confident and deterministic. T > 1 flattens the distribution, increasing randomness and creativity but risking incoherence.\nNucleus Sampling (Top-p) restricts the choice to the smallest set of top tokens whose cumulative probability exceeds p, dynamically trimming the 'long tail' of gibberish.",
        anim: null,
        math: {
          eqs: [
            {
              l: "Temperature Scaling",
              t: "p_i = \\frac{\\exp(z_i / T)}{\\sum_j \\exp(z_j / T)}"
            }
          ]
        }
      },
      {
        id: "tok_cost",
        title: "Tokenization vs Inference Cost",
        body: "Processing text costs compute. Tokenization is the fast O(N) process of chunking text into IDs using a fixed dictionary. It takes microseconds on a CPU.\n\nInference is the O(N^2) forward pass through billions of parameters on a GPU. The cost of generating a token is astronomically higher than tokenizing it. This is why LLM pricing is measured in 'per 1M tokens' processed by the model, ignoring the negligible cost of the tokenizer itself.",
        anim: null,
        math: null
      }
    ]
  },
  {
    id: "pre2017",
    label: "02 — Before 2017",
    title: "The Pre-Transformer Era",
    color: "#FF6B6B",
    icon: "🕰️",
    subs: [
      {
        id: "ngrams",
        title: "N-Gram Language Models",
        body: "N-gram models estimate the probability of a word given the previous n−1 words by counting occurrences in a corpus. A bigram model uses the count of adjacent pairs divided by the count of the first word.\n\nThey are simple, fast, and interpretable — but suffer from data sparsity (most long n-grams are never seen in training) and cannot capture dependencies beyond n-1 words. A 5-gram model literally cannot learn that the subject of a sentence determines the verb 20 words later.\n\nThese were the dominant approach in speech recognition and machine translation through the 2000s.",
        anim: "ngram",
        math: {
          eqs: [
            {
              l: "Bigram probability",
              t: "P(w_i \\mid w_{i-1}) = \\dfrac{\\text{count}(w_{i-1},\\, w_i)}{\\text{count}(w_{i-1})}"
            }
          ]
        }
      },
      {
        id: "w2v",
        title: "Word Embeddings: Word2Vec & GloVe",
        body: "Word2Vec (Mikolov et al., 2013) learns dense vectors for words such that similar words land near each other in embedding space. The skip-gram variant predicts surrounding context words from a target word using softmax over dot products.\n\nGloVe (Pennington et al., 2014) factorizes a global co-occurrence matrix: it learns vectors whose dot products approximate the log co-occurrence frequency.\n\nKey result: linear algebra on vectors encodes semantic relationships — the famous 'king − man + woman ≈ queen' vector arithmetic.\n\nCritical limitation: these are context-invariant — the word 'bank' gets one fixed vector regardless of whether it means riverbank or financial institution. This was the core flaw that contextual models (ELMo, BERT) later fixed.",
        anim: "w2v",
        math: {
          eqs: [
            {
              l: "Skip-gram objective",
              t: "P(c \\mid t) \\propto \\exp(\\mathbf{v}_c \\cdot \\mathbf{v}_t)"
            },
            {
              l: "GloVe objective",
              t: "J = \\textstyle\\sum_{i,j} f(X_{ij})\\,(\\mathbf{v}_i^\\top \\mathbf{v}_j - \\log X_{ij})^2"
            }
          ]
        }
      },
      {
        id: "hmm_crf",
        title: "HMMs & CRFs",
        body: "Before deep learning, sequence labeling (like finding names in text) relied on statistical graphical models.\n\nHidden Markov Models (HMMs) model a sequence of hidden states (like parts of speech) that probabilistically emit the observed words. They are generative.\nConditional Random Fields (CRFs) model the conditional probability of the state sequence directly given the observations. They are discriminative and handle overlapping features much better than HMMs, becoming the gold standard for NLP until neural networks took over.",
        anim: null,
        math: {
          eqs: [
            {
              l: "HMM Joint Prob",
              t: "P(X,Y) = \\prod_{t=1}^T P(y_t|y_{t-1}) P(x_t|y_t)"
            }
          ]
        }
      },
      {
        id: "elmo",
        title: "ELMo: Contextual Embeddings (2018)",
        body: "Embeddings from Language Models (ELMo, Peters et al.) fixed the fatal flaw of Word2Vec: context-independence.\n\nInstead of a static dictionary lookup, ELMo runs a bidirectional LSTM over the entire sentence. The vector for the word 'bank' is dynamically constructed based on the surrounding words. This was a massive leap forward, proving that pre-training deep language models on unlabeled text creates representations that drastically improve downstream tasks.",
        anim: null,
        math: null
      },
      {
        id: "rnn",
        title: "RNNs & The Vanishing Gradient Problem",
        body: "An RNN processes a sequence one element at a time, maintaining a hidden state h_t that summarizes everything seen so far. The same weight matrix W_h is reused at every step.\n\nThe vanishing gradient problem: during backpropagation, gradients are propagated backward through every time step. Each step multiplies by the Jacobian of the state transition — essentially by W_h repeatedly. If the largest eigenvalue of W_h is less than 1, the product of T such matrices shrinks exponentially toward zero. The network literally cannot 'feel' what happened far back in the sequence.\n\nIf the eigenvalue exceeds 1, gradients explode — causing unstable training (addressed by gradient clipping, but the expressiveness limit remains).",
        anim: "rnn",
        math: {
          eqs: [
            {
              l: "RNN state update",
              t: "h_t = \\sigma(W_h \\cdot h_{t-1} + W_x \\cdot x_t + b)"
            },
            {
              l: "Vanishing gradient",
              t: "\\frac{\\partial L}{\\partial h_0} = \\frac{\\partial L}{\\partial h_T} \\prod_{t=1}^{T} W_h \\xrightarrow[T\\to\\infty]{} 0"
            }
          ]
        }
      },
      {
        id: "lstm",
        title: "LSTMs & GRUs — Gating the Memory",
        body: "LSTMs (Hochreiter & Schmidhuber, 1997) add a cell state and three gates — forget, input, and output — that regulate information flow. Each gate uses a sigmoid function σ(x) = 1/(1+e^{-x}) outputting a value in [0,1]: 0 means 'block everything', 1 means 'pass everything'.\n\nThe crucial trick: the cell state is updated additively (C_t = f_t ⊙ C_{t-1} + i_t ⊙ C̃_t). Addition means the gradient of the loss with respect to C_{t-1} flows back as just f_t — not a full matrix multiplication — so gradients travel much further back in time without vanishing.\n\nGRUs (Cho et al., 2014) simplify to two gates (reset and update), offering comparable quality at lower computational cost.",
        anim: "lstm",
        math: {
          eqs: [
            {
              l: "Forget gate",
              t: "f_t = \\sigma(W_f [h_{t-1}, x_t] + b_f)"
            },
            {
              l: "Cell update (additive)",
              t: "C_t = f_t \\odot C_{t-1} + i_t \\odot \\tilde{C}_t"
            },
            {
              l: "Output",
              t: "h_t = o_t \\odot \\tanh(C_t)"
            }
          ]
        }
      },
      {
        id: "seq2seq",
        title: "The Seq2Seq Bottleneck",
        body: "Sequence-to-Sequence (Sutskever et al., 2014) architectures translate an input sequence to an output sequence using two RNNs. The Encoder reads the input and compresses its entire meaning into a single, fixed-size 'context vector'. The Decoder then generates the output from this vector.\n\nThe Bottleneck: Forgetting. A single vector cannot hold the details of a 50-word sentence. Performance plummeted on long sequences because the encoder simply couldn't remember the beginning by the time it reached the end.",
        anim: "seq2seq_bottle",
        math: {
          eqs: [
            {
              l: "Complexity",
              t: "\\text{Attention: } O(n^2 d) \\quad \\text{Recurrence: } O(n d)"
            }
          ]
        }
      },
      {
        id: "bahdanau",
        title: "The First Attention Mechanism (Bahdanau, 2014)",
        body: "Seq2Seq models compressed entire input sentences into one fixed-size vector — a severe bottleneck for long inputs. Bahdanau et al. solved this with attention.\n\nAt each decoder step: (1) compute an alignment score e_{tj} between the current decoder state s_{t-1} and each encoder hidden state h_j using a small neural network; (2) normalize the scores with softmax to get attention weights α; (3) form a context vector c_t as the weighted sum of encoder states.\n\nThe decoder can now dynamically focus on whichever input positions are most relevant for generating each output token — rather than being forced to cram everything into a single vector. This was the conceptual seed from which Transformer self-attention grew.",
        anim: "bahdanau",
        math: {
          eqs: [
            {
              l: "Alignment score",
              t: "e_{tj} = a(s_{t-1},\\, h_j)"
            },
            {
              l: "Attention weights",
              t: "\\alpha_{tj} = \\dfrac{\\exp(e_{tj})}{\\sum_k \\exp(e_{tk})}"
            },
            {
              l: "Context vector",
              t: "c_t = \\sum_j \\alpha_{tj}\\, h_j"
            }
          ]
        }
      }
    ]
  },
  {
    id: "transformer",
    label: "03 — The Transformer",
    title: "Attention Is All You Need (2017)",
    color: "#00C9A7",
    icon: "⚡",
    subs: [
      {
        id: "arch",
        title: "Encoder-Decoder Architecture Overview",
        body: "The original Transformer (Vaswani et al., 2017) is an encoder-decoder designed for machine translation. The encoder reads the entire input simultaneously and builds rich contextual representations. The decoder generates output one token at a time, attending to both its own outputs and the encoder's representations.\n\nBoth encoder and decoder are stacks of identical layers. Each layer contains: (1) a multi-head (self-)attention sub-layer, and (2) a position-wise feed-forward network sub-layer. Residual connections and layer normalization wrap each sub-layer.\n\nThe encoder uses bidirectional self-attention (each token can attend to all others). The decoder uses masked self-attention (each token can only attend to earlier generated tokens — causal masking) plus cross-attention to the encoder.",
        anim: "enc_dec",
        math: {
          eqs: [
            {
              l: "Encoder Output",
              t: "\\mathbf{H} = \\text{Encoder}(\\mathbf{X}) \\in \\mathbb{R}^{n \\times d}"
            }
          ]
        }
      },
      {
        id: "pos",
        title: "Positional Encoding — Injecting Order",
        body: "Self-attention processes all tokens simultaneously with no inherent notion of order. Without positional information, 'dog bites man' and 'man bites dog' look identical to the attention mechanism.\n\nSolution: add a fixed positional signal to each token embedding before entering the network. The sinusoidal encoding uses a geometric progression of frequencies — low frequencies encode coarse position; high frequencies encode fine-grained position.\n\nThe key mathematical property: for any fixed offset k, PE(pos+k) is a linear function of PE(pos). This means the model can learn to detect relative offsets between positions from absolute encodings alone, without ever being explicitly taught what 'distance 5 apart' looks like.",
        anim: "posenc",
        math: {
          eqs: [
            {
              l: "Even dims",
              t: "PE(pos, 2i) = \\sin\\!\\left(\\dfrac{pos}{10000^{2i/d}}\\right)"
            },
            {
              l: "Odd dims",
              t: "PE(pos, 2i+1) = \\cos\\!\\left(\\dfrac{pos}{10000^{2i/d}}\\right)"
            }
          ]
        }
      },
      {
        id: "attn",
        title: "Scaled Dot-Product Self-Attention",
        body: "Intuition: 'for this word's representation, which other words should influence it, and by how much?'\n\nStep 1 — Project: each token embedding X becomes three vectors via learned matrices. Query Q = XW_Q asks 'what am I looking for?' Key K = XW_K says 'what do I advertise?' Value V = XW_V says 'what will I contribute if attended to?'\n\nStep 2 — Score: compute raw relevance via dot products QK^T — an n×n matrix showing every pair's affinity.\n\nStep 3 — Scale: divide by √d_k. Why? For random vectors, the dot product variance scales with d_k. Large variances push softmax into saturated flat regions where gradients vanish. Dividing by √d_k keeps variance ≈ 1.\n\nStep 4 — Softmax: convert raw scores to a probability distribution over positions. The output is a convex combination of Value vectors — weighted average of what everyone offers, weighted by relevance.",
        anim: "attn",
        math: {
          eqs: [
            {
              l: "Q, K, V projections",
              t: "Q=XW_Q,\\; K=XW_K,\\; V=XW_V"
            },
            {
              l: "Scaled dot-product attention",
              t: "\\text{Attn}(Q,K,V)=\\text{softmax}\\!\\left(\\dfrac{QK^\\top}{\\sqrt{d_k}}\\right)V"
            },
            {
              l: "Softmax",
              t: "\\text{softmax}(z_i)=\\dfrac{e^{z_i}}{\\sum_j e^{z_j}}"
            }
          ]
        }
      },
      {
        id: "mha",
        title: "Multi-Head Attention — Multiple Subspaces",
        body: "A single attention computation captures one type of relationship at a time. Multi-head attention runs h independent attention operations in parallel, each in a lower-dimensional subspace of size d_k = d_model/h.\n\nWith d_model=512 and h=8, each head operates on 64 dimensions — the same total compute as single-head over the full 512 dimensions.\n\nThe outputs of all heads are concatenated and projected back to d_model via W_O. Empirically, different heads specialize: some track syntactic dependencies, some track long-range coreference, some focus on adjacent tokens, some encode semantic similarity. Multi-head attention gives the model multiple 'perspectives' simultaneously.",
        anim: "mha",
        math: {
          eqs: [
            {
              l: "Each head",
              t: "\\text{head}_i = \\text{Attn}(QW_Q^i,\\, KW_K^i,\\, VW_V^i)"
            },
            {
              l: "Multi-head",
              t: "\\text{MHA}(Q,K,V) = \\text{Concat}(\\text{head}_1,\\ldots,\\text{head}_h)\\,W_O"
            }
          ]
        },
        code: {
          lang: "python",
          text: "def multi_head_attention(q, k, v, mask):\n    # q, k, v shape: (batch, heads, seq_len, head_dim)\n    scores = torch.matmul(q, k.transpose(-2, -1)) / math.sqrt(head_dim)\n    if mask is not None:\n        scores = scores + mask\n    probs = torch.softmax(scores, dim=-1)\n    return torch.matmul(probs, v)"
        }
      },
      {
        id: "kvcache",
        title: "KV-Cache: Inference Acceleration",
        body: "During text generation, the model predicts one token at a time. To predict token $t$, the attention mechanism needs the Key and Value vectors of all $t-1$ previous tokens.\n\nRecomputing these past vectors every step is O(N^3) over the sequence length. Instead, models cache the $K$ and $V$ vectors in memory. For the new token, it only computes the new $Q, K, V$, appends the new $K, V$ to the cache, and attends to the cache. This reduces generation to O(N^2) time, but introduces a massive memory bottleneck (the KV-Cache memory footprint).",
        anim: "kvcache",
        math: null,
        code: {
          lang: "python",
          text: "def prefill(prompt, W):\n    kv_cache = []\n    for token in prompt:\n        k, v = W.k(token), W.v(token)\n        kv_cache.append((k, v))\n    return kv_cache\n\ndef decode(new_token, kv_cache, W):\n    k, v = W.k(new_token), W.v(new_token)\n    kv_cache.append((k, v))\n    # Attention over entire kv_cache\n    return compute_attention(W.q(new_token), kv_cache)"
        }
      },
      {
        id: "causal_mask",
        title: "The Causal Mask",
        body: "In a decoder, tokens cannot look into the future during training, otherwise the task of 'predict the next word' becomes trivial cheating.\n\nA causal mask is an upper-triangular matrix of $-\\infty$ added to the $QK^\\top$ attention scores before the softmax. Since $e^{-\\infty} = 0$, the attention weights for future tokens become exactly zero. The model can only attend to itself and previous positions.",
        anim: "causal_mask",
        math: {
          eqs: [
            {
              l: "Masked Attention",
              t: "\\text{softmax}\\left(\\frac{QK^\\top}{\\sqrt{d_k}} + M\\right)V"
            }
          ]
        },
        code: {
          lang: "python",
          text: "import torch\n\ndef get_causal_mask(seq_len):\n    # Lower triangular matrix\n    mask = torch.tril(torch.ones(seq_len, seq_len))\n    # Convert 0s to -inf for softmax\n    return mask.masked_fill(mask == 0, float('-inf'))"
        }
      },
      {
        id: "ffn",
        title: "Feed-Forward Network & Residual Connections",
        body: "After attention mixes information across tokens, each token position is independently processed by a feed-forward network — a two-layer MLP applied identically to every position. The FFN expands to 4×d_model (the 'expansion ratio') and projects back.\n\nIf attention asks 'what information from where?', the FFN asks 'how should I transform this information?' Research suggests FFN layers act as key-value memories — the first matrix matches patterns, the second matrix reads out stored values.\n\nResidual connections: instead of just computing sublayer(x), compute x + sublayer(x). By the chain rule, ∂(x + f(x))/∂x = 1 + ∂f/∂x. The '1' term provides a direct gradient highway — gradients never vanish through the residual path, enabling networks of 100+ layers to train stably.",
        anim: "ffn",
        math: {
          eqs: [
            {
              l: "FFN (ReLU, original)",
              t: "\\text{FFN}(x)=\\max(0,\\,xW_1+b_1)W_2+b_2"
            },
            {
              l: "Residual connection",
              t: "x \\leftarrow x + \\text{sublayer}(\\text{LN}(x))"
            }
          ]
        },
        code: {
          lang: "python",
          text: "class FFN(nn.Module):\n    def __init__(self, dim, hidden_dim):\n        super().__init__()\n        self.up = nn.Linear(dim, hidden_dim)\n        self.down = nn.Linear(hidden_dim, dim)\n        self.act = nn.GELU()\n\n    def forward(self, x):\n        return self.down(self.act(self.up(x)))"
        }
      },
      {
        id: "loss",
        title: "Cross-Entropy Loss & Training Objective",
        body: "From information theory: entropy H(p) = −Σ p·log p measures irreducible uncertainty. Cross-entropy H(y,p) = −Σ y·log p is the expected code length when using model distribution p to encode samples from true distribution y. Minimizing cross-entropy drives p toward y.\n\nFor causal LMs (GPT-style): L = −Σ_t log P(x_t | x_{<t}) — sum the negative log-probability of each token given its preceding context. Teacher forcing: always feed ground-truth previous tokens during training (not the model's own predictions), which speeds and stabilizes learning.\n\nPerplexity = exp(L_CE) is the model's 'effective branching factor': how many equally likely choices it appears to be making at each step. Perplexity 10 means the model behaves as if choosing uniformly among 10 candidates — lower is better.",
        anim: "xent",
        math: {
          eqs: [
            {
              l: "Cross-entropy",
              t: "L_{CE}=-\\sum_i y_i \\log(p_i)"
            },
            {
              l: "Causal LM objective",
              t: "L=-\\sum_t \\log P(x_t \\mid x_{<t})"
            },
            {
              l: "Perplexity",
              t: "\\text{PPL}=\\exp(L_{CE})"
            }
          ]
        },
        code: {
          lang: "python",
          text: "def cross_entropy(logits, targets):\n    # Standard language modeling objective\n    # Maximize log probability of correct next token\n    log_probs = F.log_softmax(logits, dim=-1)\n    return -log_probs.gather(dim=-1, index=targets.unsqueeze(-1)).mean()"
        }
      },
      {
        id: "params",
        title: "Parameter Count Analysis",
        body: "For a Transformer with d-dimensional embeddings, h attention heads, and n layers:\n\n• Attention block: 4 weight matrices W_Q, W_K, W_V, W_O, each d×d → 4d² params per layer\n• FFN block (inner dim 4d): two matrices d→4d→d → 8d² params per layer\n• Total per layer: ~12d²\n• Embedding table: V×d (vocabulary size × hidden dim)\n\nValidation on GPT-3: d=12288, n=96, V≈50K → 96 × 12 × 12288² + 50000 × 12288 ≈ 174.5B + 0.6B ≈ 175B ✓\n\nKey implication: widening the model (increasing d) is quadratically expensive. Doubling d quadruples the parameter count. This is why MoE architectures — which scale total parameters without scaling active compute — became so attractive.",
        anim: "params",
        math: {
          eqs: [
            {
              l: "Per-layer params",
              t: "\\approx 4d^2 + 8d^2 = 12d_{\\text{model}}^2"
            },
            {
              l: "Total params",
              t: "\\approx n \\times 12d_{\\text{model}}^2 + V \\times d_{\\text{model}}"
            }
          ]
        }
      },
      {
        id: "regularizers",
        title: "Regularization: Dropout & Label Smoothing",
        body: "To prevent the millions of parameters from simply memorizing the training data (overfitting), the Transformer uses two key regularizers:\n\nDropout randomly zeroes out a percentage of neuron activations during training, forcing the network to build redundant, robust representations.\nLabel Smoothing prevents the model from becoming overly confident. Instead of aiming for 100% probability on the correct token and 0% on others, it aims for (e.g.) 90% on the correct token and distributes the remaining 10% uniformly across the rest of the vocabulary, preventing exploding gradients.",
        anim: null,
        math: {
          eqs: [
            {
              l: "Smoothed Target",
              t: "y_k^{LS} = (1-\\alpha)y_k + \\alpha/K"
            }
          ]
        }
      },
      {
        id: "beam",
        title: "Beam Search Decoding",
        body: "Greedy decoding only picks the immediate best next token. But what if a slightly suboptimal token now leads to a much better sequence later?\n\nBeam Search maintains the top-B most likely sequences (the 'beam width') at each step. It expands all B sequences, scores them, and keeps the new top-B. It is standard in tasks requiring strict correctness like translation or summarization, whereas stochastic sampling (Top-p) is preferred for open-ended creative generation.",
        anim: null,
        math: null
      },
      {
        id: "fwd_pass",
        title: "Full Forward Pass Walkthrough",
        body: "Putting it all together for one step of generation:\n1. Tokenize the input prompt into integer IDs.\n2. Lookup the embedding for each ID and add Positional Encoding.\n3. Pass through $N$ layers: compute Multi-Head Attention, add residual, apply LayerNorm, compute FFN, add residual, apply LayerNorm.\n4. Multiply the final hidden state by the unembedding matrix to get logits over the vocabulary.\n5. Apply Temperature and Softmax to get probabilities.\n6. Sample a token, append to prompt, and repeat.",
        anim: null,
        math: null
      }
    ]
  },
  {
    id: "clusterA",
    label: "04 — Dense Transformers",
    title: "Cluster A: Quadratic Attention O(n²)",
    color: "#F7B731",
    icon: "🧱",
    subs: [
      {
        id: "bert",
        title: "Encoder-Only: BERT & Masked Language Modeling",
        body: "BERT (Devlin et al., 2018) uses Masked Language Modeling (MLM): randomly replace ~15% of input tokens with a [MASK] placeholder, and train the model to predict the original tokens using bidirectional context — both left and right.\n\nBidirectionality is the key differentiator from GPT: each masked token's prediction can use information from any other position in the sequence. This makes BERT excellent for understanding tasks (classification, extraction, question answering) but unsuitable for autoregressive generation.\n\nA special [CLS] token prepended to every input accumulates a sentence-level representation via its final hidden state — useful for classification.\n\nKey descendants: RoBERTa dropped Next Sentence Prediction and added dynamic masking — matched BERT with better efficiency. ALBERT used cross-layer parameter sharing to reduce memory. DistilBERT used knowledge distillation to produce a 40%-smaller, 60%-faster model retaining 97% of BERT's performance.",
        anim: "bert",
        math: {
          eqs: [
            {
              l: "MLM loss",
              t: "L_{\\text{MLM}}=-\\sum_{i\\in\\text{masked}}\\log P(x_i\\mid x_{\\text{context}})"
            }
          ]
        }
      },
      {
        id: "gpt",
        title: "Decoder-Only: GPT & Causal Language Modeling",
        body: "GPT-1 (Radford et al., 2018) uses Causal Language Modeling (CLM): predict the next token given all previous tokens. A causal mask sets all future-position attention scores to −∞ before softmax, making those weights exactly 0.\n\nAutoregressive generation: feed a prompt, sample the next token from the output probability distribution, append it to the context, repeat. This loop generates sequences of arbitrary length.\n\nGPT-3 (175B, 2020) demonstrated in-context learning: present a few examples of a task in the prompt, and the model solves new instances without any weight updates. This is qualitatively different from fine-tuning — the 'learning' happens inside the forward pass, via attention computations over the context.\n\nDecoder-only became dominant for generation because: the CLM objective covers any text, scales cleanly with compute, and eliminates the need for paired input-output training data.",
        anim: "gpt",
        math: {
          eqs: [
            {
              l: "CLM objective",
              t: "L=-\\sum_t\\log P(x_t\\mid x_{<t})"
            }
          ]
        },
        code: {
          lang: "python",
          text: "class TransformerBlock(nn.Module):\n    def __init__(self):\n        self.attn = MultiHeadAttention()\n        self.ffn = FeedForward()\n        self.ln1 = RMSNorm()\n        self.ln2 = RMSNorm()\n\n    def forward(self, x):\n        # Pre-normalization architecture\n        x = x + self.attn(self.ln1(x))\n        x = x + self.ffn(self.ln2(x))\n        return x"
        }
      },
      {
        id: "t5",
        title: "Encoder-Decoder: T5 & Span Corruption",
        body: "T5 (Raffel et al., 2019) unified all NLP tasks as text-to-text: the model always takes a text string in and produces a text string out. 'Classify sentiment: I love this film' → 'positive'. 'Translate to French: Hello' → 'Bonjour'. Even regression becomes text: 'STS-B score: ...' → '3.8'.\n\nPre-training uses span corruption: randomly mask contiguous spans of tokens, have the decoder reconstruct only the masked spans. This preserves more context in the encoder than BERT-style per-token masking.\n\nCross-attention bridges encoder and decoder: at each decoder layer, the decoder representations are queries while the encoder's final representations are keys and values. This lets the decoder dynamically 'read' any part of the encoded input while generating output.\n\nBART (Lewis et al., 2019) is a denoising autoencoder — various corruptions (deletion, permutation, text infilling) applied to the input, decoder reconstructs the original. Especially strong for abstractive summarization.",
        anim: "t5",
        math: {
          eqs: [
            {
              l: "Cross-attention",
              t: "\\text{Attn}(Q_{\\text{dec}},K_{\\text{enc}},V_{\\text{enc}})=\\text{softmax}\\!\\left(\\tfrac{Q_{\\text{dec}}K_{\\text{enc}}^\\top}{\\sqrt{d_k}}\\right)V_{\\text{enc}}"
            }
          ]
        }
      },
      {
        id: "moe",
        title: "Mixture of Experts (MoE)",
        body: "Core intuition: instead of routing every token through every parameter, selectively activate a small subset of specialized 'expert' sub-networks. This decouples total parameters (knowledge capacity) from active compute (FLOPs per forward pass).\n\nEach MoE layer replaces the FFN with N expert FFNs. A gating network computes routing probabilities for each expert. Sparse MoE activates only the top-k experts per token — the others contribute nothing.\n\nLoad balancing is critical: without constraints, the router degenerates — it collapses onto a few favorite experts and ignores the rest. The auxiliary loss penalizes imbalance by minimizing Σ f_i · P_i across experts, where f_i is the fraction of tokens routed to expert i and P_i is the mean routing probability.\n\nDeepSeek-V3 (2024/25): 671B total parameters / 37B active per token. Uses 256 routed + 1 shared expert per layer, 8 activated per token. An auxiliary-loss-free load balancer uses per-expert bias terms instead of the standard loss term. Trained on 14.8T tokens in 2.788M H800 GPU-hours — a remarkably efficient frontier model.",
        anim: "moe",
        math: {
          eqs: [
            {
              l: "MoE output",
              t: "y=\\sum_{i\\in\\text{top-k}} g_i(x)\\cdot E_i(x)"
            },
            {
              l: "Gating",
              t: "g(x)=\\text{softmax}(\\text{TopK}(xW_{\\text{gate}}))"
            },
            {
              l: "Load-balance loss",
              t: "L_{\\text{aux}}=\\alpha N\\sum_i f_i P_i"
            }
          ]
        },
        code: {
          lang: "python",
          text: "def sparse_moe(x, router, experts, top_k=2):\n    # router outputs logits for each expert\n    routing_logits = router(x)\n    routing_probs = torch.softmax(routing_logits, dim=-1)\n    \n    # Select top_k experts\n    top_probs, top_indices = torch.topk(routing_probs, top_k)\n    top_probs = top_probs / top_probs.sum(dim=-1, keepdim=True) # Normalize\n    \n    # Combine expert outputs\n    out = sum(prob * experts[idx](x) for prob, idx in zip(top_probs, top_indices))\n    return out"
        }
      },
      {
        id: "gpt4",
        title: "GPT-4 Architecture Notes (2023)",
        body: "While OpenAI never published the exact architecture, widespread leaks and community consensus paint GPT-4 not as a single dense model, but a massive Mixture of Experts.\n\nEstimates suggest ~1.8 Trillion total parameters, split across 16 experts of ~111B parameters each. During inference, it routes each token to 2 experts, meaning active compute is 'only' ~280B parameters per token. This architectural leap allowed a massive increase in knowledge capacity without an unmanageable increase in inference latency.",
        anim: null,
        math: null
      },
      {
        id: "sft",
        title: "Supervised Fine-Tuning (SFT)",
        body: "Pre-training creates a 'document completer' that might respond to a question by asking more questions. SFT converts it into an assistant.\n\nSFT trains the model on tens of thousands of high-quality, human-written prompt-response pairs. The objective is exactly the same (next-token prediction cross-entropy), but the data distribution is entirely conversational. This teaches the model the *format* of interaction.",
        anim: null,
        math: null,
        code: {
          lang: "python",
          text: "def compute_sft_loss(logits, targets, ignore_index=-100):\n    # Only compute loss on target tokens, ignore prompt tokens\n    loss_fct = nn.CrossEntropyLoss(ignore_index=ignore_index)\n    # Shift logits and targets\n    shift_logits = logits[..., :-1, :].contiguous()\n    shift_labels = targets[..., 1:].contiguous()\n    return loss_fct(shift_logits.view(-1, shift_logits.size(-1)), shift_labels.view(-1))"
        }
      },
      {
        id: "rlhf",
        title: "RLHF: Reinforcement Learning from Human Feedback",
        body: "SFT is expensive (requires writing perfect answers) and limited by the human's skill. RLHF (Ouyang et al., 2022) scales alignment by having humans *grade* answers instead.\n\nStep 1: Train a Reward Model (RM) on human preference data (e.g., 'Response A is better than B'). The RM learns to score text quality.\nStep 2: Use PPO (Proximal Policy Optimization) to fine-tune the LLM to maximize the RM's score. A KL-divergence penalty ensures the LLM doesn't drift too far from the original SFT model (which would cause it to output 'reward-hacking' gibberish).",
        anim: null,
        math: {
          eqs: [
            {
              l: "RLHF Objective",
              t: "\\max_{\\theta} \\mathbb{E}[R(x,y)] - \\beta \\mathbb{D}_{KL}(\\pi_\\theta || \\pi_{\\text{SFT}})"
            }
          ]
        }
      },
      {
        id: "dpo",
        title: "DPO: Direct Preference Optimization (2023)",
        body: "RLHF is notoriously unstable because PPO involves multiple models acting simultaneously. DPO (Rafailov et al., 2023) eliminates the Reward Model and the RL loop entirely.\n\nMathematical insight: the RLHF objective can be solved exactly for the optimal policy. DPO reparameterizes the reward in terms of the policy itself. You can train the LLM directly on the human preference pairs using a simple binary cross-entropy loss. It is much more stable, requires less memory, and is now the industry standard (used in LLaMA 3).",
        anim: null,
        math: {
          eqs: [
            {
              l: "DPO Loss",
              t: "L_{DPO} = -\\log \\sigma\\left(\\beta \\log \\frac{\\pi_\\theta(y_w)}{\\pi_{\\text{ref}}(y_w)} - \\beta \\log \\frac{\\pi_\\theta(y_l)}{\\pi_{\\text{ref}}(y_l)}\\right)"
            }
          ]
        }
      },
      {
        id: "cai",
        title: "Constitutional AI (Anthropic, 2022)",
        body: "Relying on humans to label harmlessness is difficult because it exposes them to toxic content, and human values are subjective. Constitutional AI replaces human raters with an AI supervisor.\n\n1. Give the model a 'Constitution' (a list of principles like 'choose the response that is least racist').\n2. Have the model generate responses to toxic prompts, then ask it to critique and revise its own responses based on the constitution.\n3. Train the model on its own revised safe responses (RLAIF: RL from AI Feedback). Claude is built on this principle.",
        anim: null,
        math: null
      },
      {
        id: "distillation",
        title: "Knowledge Distillation",
        body: "How do you get a smart 8B model? Train it to mimic a 70B model.\n\nInstead of training the small model (student) on hard labels (one-hot distributions), train it to match the exact output probabilities (soft labels) of a large model (teacher). The soft labels contain 'dark knowledge' — for example, that a dog is 10% likely to be confused with a cat, but 0% likely to be confused with a car. This richer signal allows small models to punch far above their weight class.",
        anim: null,
        math: {
          eqs: [
            {
              l: "Distillation Loss",
              t: "L = \\alpha L_{CE}(y, p_{\\text{student}}) + (1-\\alpha) T^2 \\mathbb{D}_{KL}(p_{\\text{teacher}}^{\\tau} || p_{\\text{student}}^{\\tau})"
            }
          ]
        }
      }
    ]
  },
  {
    id: "clusterB",
    label: "05 — Linear & Recurrent",
    title: "Cluster B: Sub-Quadratic O(n)",
    color: "#A29BFE",
    icon: "🌊",
    subs: [
      {
        id: "ssm",
        title: "State Space Models: S4 → Mamba",
        body: "SSMs treat sequence processing as a continuous-time dynamical system. An input signal u(t) drives a latent state x(t) through a linear ODE, and the output y(t) is read from the state.\n\nFor discrete sequences (tokens), this is discretized using a step size Δ to get a linear recurrence: x_k = Ā·x_{k-1} + B̄·u_k. Crucially, this recurrence can be computed two ways: as a recurrence (O(1) memory, efficient for inference) or as a 1D convolution via the convolution theorem (parallel, efficient for training).\n\nS4 (Gu et al., 2021): made SSMs work for long sequences by initializing the state matrix A using the HiPPO matrix — designed to optimally compress signal history using Legendre polynomials.\n\nMamba (Gu & Dao, 2023): adds selectivity — B, C, and the step size Δ become input-dependent functions of the current token u_k. The model dynamically decides what to remember and what to forget. Reports 5× throughput vs Transformers at matching quality.",
        anim: "ssm",
        math: {
          eqs: [
            {
              l: "Continuous SSM",
              t: "x'(t)=Ax(t)+Bu(t),\\; y(t)=Cx(t)"
            },
            {
              l: "Discrete recurrence",
              t: "x_k=\\bar{A}x_{k-1}+\\bar{B}u_k,\\; y_k=Cx_k"
            },
            {
              l: "Mamba selectivity",
              t: "\\bar{B}_k=f_B(u_k),\\;\\bar{C}_k=f_C(u_k),\\;\\Delta_k=f_\\Delta(u_k)"
            }
          ]
        }
      },
      {
        id: "linAttn",
        title: "Linear Attention — Kernel Trick",
        body: "The O(n²) cost of attention comes from materializing the n×n attention matrix. Linear attention approximates this using a feature map φ: softmax(QK^T) ≈ φ(Q)·φ(K)^T.\n\nThe key insight is matrix associativity: (φ(Q)·φ(K)^T)·V vs φ(Q)·(φ(K)^T·V). By computing φ(K)^T·V first — a small d×d matrix reusable for all queries — the total cost drops from O(n²·d) to O(n·d²).\n\nThe cost: softmax produces sharp, data-dependent attention weights that concentrate on a few highly relevant positions. Feature-map approximations produce softer weights — degrading quality on tasks requiring precise retrieval ('copy this exact token from position 47').",
        anim: "linAttn",
        math: {
          eqs: [
            {
              l: "Exact attention O(n²d)",
              t: "\\text{Attn}(Q,K,V)=\\text{softmax}(QK^\\top/\\sqrt{d})\\,V"
            },
            {
              l: "Linear attention O(nd²)",
              t: "\\text{Attn}_{\\text{lin}}=\\dfrac{\\phi(Q)\\,(\\phi(K)^\\top V)}{\\phi(Q)\\cdot\\mathbf{1}^\\top\\phi(K)}"
            }
          ]
        }
      },
      {
        id: "rwkv",
        title: "RWKV — RNNs for the Transformer Era",
        body: "RWKV (Peng et al., 2023) is an architecture that achieves: (1) Transformer-style parallel training, (2) RNN-style O(1) memory inference. It replaces attention with a time-mixing block based on the WKV operator.\n\nWKV is a weighted sum of past value vectors, where each past token's weight decays exponentially with distance at a learned rate w per channel. A bonus term u prevents the current token from being suppressed.\n\nThis can be computed as a prefix scan during training (parallel, log depth) or as a running recurrence during inference (O(1) memory). The same weights serve both modes — analogous to how SSMs support both convolution and recurrence.\n\nKey difference from SSMs: RWKV's time decay is a fixed learned scalar per channel, not an input-dependent matrix.",
        anim: "rwkv",
        math: {
          eqs: [
            {
              l: "WKV (time-mixing)",
              t: "\\text{wkv}_t=\\frac{\\sum_{i<t} e^{-(t-i-1)w+k_i}v_i + e^{u+k_t}v_t}{\\sum_{i<t} e^{-(t-i-1)w+k_i} + e^{u+k_t}}"
            }
          ]
        }
      },
      {
        id: "retnet",
        title: "RetNet — Retention Networks",
        body: "RetNet (Sun et al., 2023) introduces a retention mechanism with three equivalent computational forms enabling the 'impossible triangle': training parallelism, O(1) inference memory, and efficient chunk-wise processing.\n\nIn parallel form, Retention(Q,K,V) = (QK^T ⊙ D)V, where D is a causal decay mask: D_nm = γ^{n-m} for n≥m (else 0). The scalar γ ∈ (0,1) is the retention rate — controlling how quickly past tokens lose influence.\n\nPositional phases: Q and K vectors are multiplied by complex rotations e^{imθ} and e^{-inθ} respectively (similar to RoPE), so their inner product encodes relative position. Combined with exponential decay, retention is effectively linear attention + rotary phases + explicit exponential forgetting.\n\nThe recurrent form maintains a d×d state matrix that is updated with each new token — replacing the growing KV-cache with a fixed-size state.",
        anim: "retnet",
        math: {
          eqs: [
            {
              l: "Parallel retention",
              t: "\\text{Ret}(Q,K,V)=(QK^\\top\\odot D)\\,V"
            },
            {
              l: "Causal decay mask",
              t: "D_{nm}=\\begin{cases}\\gamma^{n-m} & n\\ge m \\\\ 0 & \\text{else}\\end{cases}"
            }
          ]
        }
      },
      {
        id: "hybrid",
        title: "Hybrid Architectures (Jamba, Griffin)",
        body: "While pure SSMs (like Mamba) solve the O(n²) memory bottleneck, they struggle with 'needle-in-a-haystack' retrieval tasks because they cannot perform exact lookups over long contexts—everything is compressed into a fixed-size state.\n\nHybrid architectures combine the best of both worlds. **Jamba (AI21, 2024)** interleaved Transformer layers with Mamba layers (e.g., a ratio of 1:7) and added MoE (Mixture of Experts). The few Attention layers maintain precise retrieval across the context window, while the Mamba layers handle local processing and sequence mixing with O(1) memory footprint.\n\nSimilarly, **Griffin (DeepMind, 2024)** combines local attention (windowed) with linear RNNs. By restricting attention to a local window, it bounds the KV-cache size, while the RNN aggregates global context.",
        anim: null,
        math: {
          eqs: [
            {
              l: "Exposure Fraction",
              t: "\\text{Ratio} = \\frac{1 \\text{ Attn}}{7 \\text{ Mamba}}, \\text{ Cost} \\propto \\frac{1}{8} O(n^2)"
            }
          ]
        }
      },
      {
        id: "sparse",
        title: "Sparse & Windowed Attention",
        body: "Instead of abandoning attention, another path is to compute it sparsely. Full attention computes a score for every token against every other token. Sparse attention restricts this.\n\n**Local/Windowed Attention (e.g., Longformer, Mistral):** Tokens only attend to a sliding window of recent tokens (e.g., the last 4096 tokens). This caps memory at O(n·w) instead of O(n²).\n**Strided/Dilated Attention:** Tokens attend to distant tokens at regular intervals (e.g., every 8th token) to capture long-range structure without full computation.\n**Block-Sparse Attention (e.g., BigBird):** A mix of local windows, random distant tokens, and a few 'global' tokens (like a [CLS] token) that attend to everything. BigBird proved this is Turing complete.",
        anim: null,
        math: null
      }
    ]
  },
  {
    id: "alt",
    label: "06 — Alternative Architectures",
    title: "Beyond the Transformer Stack",
    color: "#6C63FF",
    icon: "🛸",
    subs: [
      {
        id: "kan",
        title: "KAN (Kolmogorov-Arnold Networks)",
        body: "KANs (Liu et al., 2024) challenge the fundamental structure of MLPs. In a standard MLP, there are fixed activation functions (like ReLU or SiLU) on nodes, and learnable linear weights on the edges.\n\nKANs invert this based on the Kolmogorov-Arnold representation theorem. In a KAN, the nodes simply sum their inputs, and the *edges* contain learnable non-linear functions (parameterized as 1D B-splines).\n\nBenefits: KANs are highly interpretable (you can inspect the learned 1D curves) and avoid catastrophic forgetting in continual learning. They can achieve matching accuracy to MLPs with far fewer parameters, though their training wall-clock time is significantly slower due to the lack of hardware-optimized spline operations.",
        anim: null,
        math: {
          eqs: [
            {
              l: "Standard MLP",
              t: "y = \\sigma(Wx)"
            },
            {
              l: "KAN Edge",
              t: "\\phi(x) = w\\left(b(x) + \\sum c_i B_i(x)\\right)"
            }
          ]
        }
      },
      {
        id: "liquid",
        title: "Liquid Neural Networks",
        body: "Liquid Neural Networks (Hasani et al., 2021) are continuous-time recurrent networks inspired by the nervous system of C. elegans.\n\nUnlike traditional RNNs where the 'time constant' (how fast the state updates) is fixed, Liquid networks feature *input-dependent time constants*. Their internal equations literally adapt their structure to the incoming data stream, making them highly resilient to noise and out-of-distribution shifts (like changing the frame rate of a video or encountering turbulence in a drone flight).\n\nWhile highly parameter-efficient (solving autonomous driving tasks with ~20,000 parameters), scaling them to LLM sizes remains an open research problem due to the complexity of solving their differential equations during training.",
        anim: null,
        math: null
      },
      {
        id: "testcompute",
        title: "Test-Time Compute (o1 / o3)",
        body: "For years, scaling laws focused on *training compute* (pre-training flops). In late 2024, models like OpenAI's o1 introduced scaling laws for *inference compute* (test-time compute).\n\nInstead of generating an answer instantly, the model uses RL-trained latent reasoning processes to 'think'. It generates multiple possible reasoning chains, critiques its own steps, backtracks on errors, and explores a search tree of solutions before outputting the final answer.\n\nThis mirrors AlphaGo's Monte Carlo Tree Search (MCTS). The longer the model is allowed to 'think' at inference time, the higher its accuracy on complex math and coding tasks. This shifts the compute bottleneck from massive pre-training runs to dynamic allocation at inference.",
        anim: null,
        math: null
      }
    ]
  },
  {
    id: "tokenizers",
    label: "07 — Tokenizers",
    title: "Tokenizer Evolution",
    color: "#00B894",
    icon: "✂️",
    subs: [
      {
        id: "whytok",
        title: "Why Tokens? The Vocabulary Trade-off",
        body: "A token is the atomic discrete unit the model consumes — its input is always a sequence of integer token IDs, never raw text.\n\nThe design choice of tokenization strategy determines vocabulary size and sequence length, and the trade-off between them is fundamental:\n\n• Characters only: vocabulary of ~100 symbols, sequences 4–6× longer, long-range dependencies harder.\n• Words only: short sequences but an open-ended vocabulary where every new typo or domain term becomes 'unknown'.\n• Subwords: the Goldilocks compromise — common words are single tokens, rare words split into recognizable morphological pieces. Vocabulary is fixed and finite; sequences are manageable.\n\nThe key tension: larger vocabulary → shorter sequences (cheaper computation) but sparser statistics per token (harder to learn embeddings). Smaller vocabulary → richer per-token statistics but longer sequences and more O(n²) attention cost.",
        anim: "toktradeoff",
        math: {
          eqs: [
            {
              l: "Vocabulary Mapping",
              t: "V: \\text{token} \\to \\mathbb{Z}, \\, |V| \\in [32K, 200K]"
            }
          ]
        }
      },
      {
        id: "bpe",
        title: "BPE — Byte Pair Encoding (Sennrich, 2016)",
        body: "BPE was originally a compression algorithm. Adapted for NLP: start with individual characters as the vocabulary. Iteratively find the most frequent adjacent pair of tokens in the training corpus, merge them into one new token, and repeat until reaching the target vocabulary size.\n\nGPT-2 extended BPE to byte-level: treat raw UTF-8 bytes (0–255) as base units. Because every string is representable as bytes, there are literally zero unknown tokens — any input, language, code, or emoji is guaranteed to be encodable.\n\nTiktoken (OpenAI): cl100k_base (100,277 tokens) used by GPT-3.5/4; o200k_base (200K+ tokens) for newer models.\n\nGlitch tokens (2023 discovery, 'SolidGoldMagikarp'): GPT-2's tokenizer assigned dedicated embeddings to obscure Reddit usernames that appeared rarely or never in the model's training data. Those embeddings remained near-random. The model could not reproduce them and instead produced erratic outputs. Largely fixed in cl100k_base.",
        anim: "bpe",
        math: {
          eqs: [
            {
              l: "BPE merge rule",
              t: "(a,b)^*=\\arg\\max_{(a,b)}\\text{count}(a,b)"
            }
          ]
        },
        code: {
          lang: "python",
          text: "def byte_pair_encoding(vocab, num_merges):\n    for _ in range(num_merges):\n        pairs = get_stats(vocab)\n        if not pairs:\n            break\n        # Find most frequent pair\n        best = max(pairs, key=pairs.get)\n        # Merge pair in vocabulary\n        vocab = merge_vocab(best, vocab)\n    return vocab"
        }
      },
      {
        id: "wordpiece",
        title: "WordPiece & Unigram LM Tokenizer",
        body: "WordPiece (Wu et al., 2016): similar to BPE but selects merges by likelihood gain rather than raw frequency. Score(a,b) = count(ab)/(count(a)·count(b)) — favoring pairs whose combination is much more common than chance would predict. Continuation subwords carry a '##' prefix. Used by BERT, RoBERTa, ELECTRA.\n\nUnigram LM (Kudo, 2018): the inverse approach — start with a large candidate vocabulary and prune it. Each sentence's probability is the product of its tokens' unigram probabilities. Training: EM loop — estimate probabilities, compute each token's marginal contribution, prune the bottom-x% tokens, repeat until reaching the target vocabulary size.\n\nBecause multiple valid segmentations of a sentence exist under Unigram, the tokenizer is probabilistic — during training, you can sample different segmentations, which acts as regularization. Used by T5, ALBERT, mT5.",
        anim: "wordpiece",
        math: {
          eqs: [
            {
              l: "WordPiece merge score",
              t: "\\text{score}(a,b)=\\dfrac{\\text{count}(ab)}{\\text{count}(a)\\cdot\\text{count}(b)}"
            },
            {
              l: "Unigram sentence prob",
              t: "P(x)=\\prod_i p(x_i)"
            }
          ]
        }
      },
      {
        id: "sp",
        title: "SentencePiece & Byte-Level Tokenization",
        body: "SentencePiece (Kudo & Richardson, 2018) is a framework, not an algorithm — it wraps BPE or Unigram LM with a crucial difference: it treats the entire raw text (including spaces and newlines) as a sequence of Unicode characters, marking word boundaries with the visible character ▁. No language-specific word-splitting rules are ever needed. Handles Chinese, Japanese, Arabic, Thai natively. Used by T5, LLaMA, Gemma, mT5.\n\nByT5 (Xue et al., 2021): process directly on UTF-8 bytes. Vocabulary = exactly 256. Zero unknown tokens guaranteed. Any script, any code, any binary-adjacent content is representable. Trade-off: sequences are 3–4× longer for typical text, greatly increasing compute requirements.\n\nMultilingual disparity: English-centric BPE vocabularies assign 2–4 tokens to a single Chinese or Arabic character, meaning non-English users pay 2–4× more in API costs and have proportionally less usable context window for the same text.",
        anim: "sp",
        math: {
          eqs: [
            {
              l: "Byte Entropy",
              t: "H(byte) = -\\sum_{b=0}^{255} p(b)\\log p(b)"
            }
          ]
        }
      },
      {
        id: "regex",
        title: "Tiktoken & Regex Filtering",
        body: "Modern tokenizers like OpenAI's tiktoken use complex regex patterns *before* applying BPE merges. This prevents the tokenizer from merging tokens across natural boundaries (like punctuation, spaces, or numbers).\n\nFor example, it forces numbers to be split into up to 3 digits (e.g., '1000' -> '100', '0') to ensure more consistent mathematical representation, although it's not perfect.",
        anim: null,
        math: null
      },
      {
        id: "numbers",
        title: "The Numbers Problem",
        body: "LLMs historically struggle with arithmetic. A major reason is tokenization. If ' 1' is token A, '1' is token B, and '123' is token C, the model has to learn addition from scratch for every possible token representation of a number.\n\nLlama 3 and recent models force tokenizers to split all numbers into individual digits. By standardizing the input representation (every number is a sequence of base-10 digits), the transformer can finally learn the underlying algorithmic rules of addition and multiplication more reliably.",
        anim: null,
        math: null
      }
    ]
  },
  {
    id: "training",
    label: "08 — Training & Hardware",
    title: "Activations, Optimizers & Systems",
    color: "#FDCB6E",
    icon: "🧪",
    subs: [
      {
        id: "act",
        title: "Activation Functions: ReLU → GELU → SwiGLU",
        body: "Activation functions introduce nonlinearity — without them, any stack of linear layers collapses to a single linear transformation.\n\nReLU f(x) = max(0,x): simple, fast, but the 'dying ReLU' problem — neurons whose inputs are always negative output 0 with exactly zero gradient, permanently stopping learning.\n\nGELU (Hendrycks & Gimpel, 2016): f(x) = x·Φ(x) where Φ is the standard normal CDF. This smoothly gates each input by how likely it is to be positive. Unlike ReLU's hard cutoff, GELU gives small non-zero gradients for negative inputs. Approximated by a tanh formula for efficient computation. Used by BERT, GPT-2/3.\n\nSwiGLU (Shazeer, 2020): a gated architecture. FFN(x) = Swish(xW₁)⊙(xW₂), where Swish(x) = x·σ(x). The second branch acts as an input-dependent gate. Because this introduces a third projection matrix, the inner dimension is reduced to (2/3)×4d_model to keep total FLOPs constant. Empirically the best activation for Transformers. Now default in LLaMA, PaLM, Mistral, Qwen, DeepSeek.",
        anim: "acts",
        math: {
          eqs: [
            {
              l: "ReLU",
              t: "\\text{ReLU}(x)=\\max(0,x)"
            },
            {
              l: "GELU (approximation)",
              t: "\\text{GELU}(x)\\approx 0.5x\\left(1+\\tanh\\!\\left(\\sqrt{\\tfrac{2}{\\pi}}(x+0.044715x^3)\\right)\\right)"
            },
            {
              l: "SwiGLU",
              t: "\\text{SwiGLU}(x,W_1,W_2)=\\underbrace{xW_1\\cdot\\sigma(xW_1)}_{\\text{Swish}}\\odot (xW_2)"
            }
          ]
        },
        code: {
          lang: "python",
          text: "import torch\nimport torch.nn.functional as F\n\ndef swiglu(x, W, V):\n    # x: (batch, dim)\n    # W, V: linear projections\n    gate = F.silu(x @ W)  # SiLU is Swish(x)\n    val = x @ V\n    return gate * val"
        }
      },
      {
        id: "norm",
        title: "Normalization: LayerNorm vs. RMSNorm",
        body: "Without normalization, the distribution of each layer's inputs shifts as earlier layer weights update — 'internal covariate shift' — causing training instability and requiring very low learning rates.\n\nLayerNorm (Ba et al., 2016): for each example independently, normalize across the feature dimension using mean and variance, then apply learnable scale γ and shift β. Different from BatchNorm (normalizes across the batch), which is inappropriate for variable-length sequences.\n\nPre-Norm vs Post-Norm: the original Transformer applied LN after the residual: x = LN(x + sublayer(x)). Modern models (GPT-2 onward) apply LN before: x = x + sublayer(LN(x)). Pre-Norm preserves a clean residual stream, enabling much deeper and more stable networks.\n\nRMSNorm (Zhang & Sennrich, 2019): drops the mean-centering step — normalizes only by the root mean square of activations. ~15% cheaper to compute, empirically matches LayerNorm quality. Now standard in LLaMA, Mistral, Gemma, Qwen, DeepSeek.",
        anim: "norm",
        math: {
          eqs: [
            {
              l: "LayerNorm",
              t: "\\text{LN}(x)=\\gamma\\cdot\\dfrac{x-\\mu}{\\sqrt{\\sigma^2+\\varepsilon}}+\\beta"
            },
            {
              l: "RMSNorm",
              t: "\\text{RMSNorm}(x)=\\dfrac{x}{\\text{RMS}(x)}\\cdot\\gamma,\\quad\\text{RMS}(x)=\\sqrt{\\tfrac{1}{d}\\sum_i x_i^2}"
            },
            {
              l: "Pre-Norm (modern)",
              t: "x \\leftarrow x + \\text{sublayer}(\\text{RMSNorm}(x))"
            }
          ]
        },
        code: {
          lang: "python",
          text: "import torch\n\nclass RMSNorm(torch.nn.Module):\n    def __init__(self, dim, eps=1e-6):\n        super().__init__()\n        self.eps = eps\n        self.weight = torch.nn.Parameter(torch.ones(dim))\n\n    def forward(self, x):\n        # Root Mean Square\n        rms = torch.sqrt(torch.mean(x**2, dim=-1, keepdim=True) + self.eps)\n        return (x / rms) * self.weight"
        }
      },
      {
        id: "rope",
        title: "RoPE — Rotary Position Embedding",
        body: "RoPE (Su et al., 2021) is the dominant positional encoding in modern LLMs. Core idea: encode position by rotating Q and K vectors in 2D subspaces.\n\nFor each dimension pair (2i, 2i+1), apply a 2D rotation matrix by angle m·θᵢ, where m is the token position and θᵢ = 10000^{−2i/d} is a frequency (geometric progression, like sinusoidal PE).\n\nThe crucial mathematical property: the dot product q_m·k_n after applying their rotations equals f(m−n) — it depends only on the relative offset, not the absolute positions. Relative position emerges naturally from absolute rotations.\n\nAdvantages: parameter-free (no learned table); works with linear attention; extrapolates more gracefully than learned absolute embeddings; compatible with standard self-attention kernels.\n\nUsed by: LLaMA (all versions), Mistral, Qwen, Falcon, Gemma, DeepSeek.\n\nYaRN (Peng et al., 2023): extends RoPE beyond training context by interpolating rotary frequencies — ~2.5× fewer fine-tuning steps than position interpolation (PI).",
        anim: "rope",
        math: {
          eqs: [
            {
              l: "2D rotation at position m",
              t: "\\begin{bmatrix}q_{2i}'\\\\q_{2i+1}'\\end{bmatrix}=\\begin{bmatrix}\\cos m\\theta_i & -\\sin m\\theta_i\\\\\\sin m\\theta_i & \\cos m\\theta_i\\end{bmatrix}\\begin{bmatrix}q_{2i}\\\\q_{2i+1}\\end{bmatrix}"
            },
            {
              l: "Frequency schedule",
              t: "\\theta_i=10000^{-2i/d}"
            },
            {
              l: "Relative distance property",
              t: "q_m^\\top k_n = f(m-n)\\quad\\text{(only depends on relative offset)}"
            }
          ]
        },
        code: {
          lang: "python",
          text: "def apply_rope(q, k, positions):\n    # Rotate adjacent pairs of dimensions\n    q_rotated = q * cos(positions) + rotate_half(q) * sin(positions)\n    k_rotated = k * cos(positions) + rotate_half(k) * sin(positions)\n    return q_rotated, k_rotated"
        }
      },
      {
        id: "disttrain",
        title: "Distributed Training Dimensions",
        body: "Training frontier models requires splitting the workload across thousands of GPUs.\n\n• **Data Parallelism (DP/FSDP):** Copy the model weights to every GPU, split the data. FSDP shards the optimizer states and weights to save memory.\n• **Tensor Parallelism (TP):** Split individual matrix multiplications across GPUs (e.g., Q, K, V projections). Requires extremely high-bandwidth interconnects (NVLink) because of all-reduce operations.\n• **Pipeline Parallelism (PP):** Split the model by layers across GPUs (GPU 1 computes layers 1-4, then sends activations to GPU 2 for layers 5-8).\n• **Expert Parallelism (EP):** For MoE models, different GPUs host different experts. Tokens are routed across the network to the correct GPU.",
        anim: null,
        math: null
      },
      {
        id: "optim",
        title: "Modern Optimizers (AdamW to Muon)",
        body: "AdamW has been the default optimizer since 2017, combining adaptive learning rates (using momentum and variance) with decoupled weight decay.\n\nHowever, AdamW scales memory poorly because it keeps two state variables (moment 1 and 2) per parameter. \n\nNewer optimizers are challenging this:\n• **Sophia (2023):** A second-order optimizer using a light-weight diagonal Hessian estimate. Updates clip gradients dynamically. Claims 2x faster convergence than Adam.\n• **Muon (2024):** Used in DeepSeek training. It applies orthogonalization (Newton-Schulz iteration) to the gradients of weight matrices, effectively preconditiong them without storing large momentum tensors. Extremely memory efficient.",
        anim: null,
        math: null
      },
      {
        id: "flashhw",
        title: "FlashAttention Internals",
        body: "While conceptually solving the memory bottleneck, FlashAttention is really a masterclass in hardware-aware programming. GPUs have a massive but slow memory pool (HBM) and a tiny but incredibly fast memory pool (SRAM).\n\nStandard attention writes intermediate matrices (like QK^T) to HBM, then reads them back to apply Softmax. This IO bottleneck dominates the runtime.\n\nFlashAttention aggressively tiles the Q, K, and V blocks to fit exactly into SRAM. It computes the attention incrementally (online softmax) and only writes the final output back to HBM. FlashAttention-3 goes further, exploiting the Hopper architecture's asynchronous DMA and Tensor Cores to overlap data movement with math.",
        anim: "roofline",
        math: null
      }
    ]
  },
  {
    id: "infer",
    label: "09 — Inference & Deployment",
    title: "Serving at Scale",
    color: "#0984E3",
    icon: "🚀",
    subs: [
      {
        id: "quant",
        title: "Quantization (PTQ & GGUF)",
        body: "FP16 requires 2 bytes per parameter (a 70B model needs 140GB of VRAM just to load). Quantization compresses this to 8-bit, 4-bit, or even lower.\n\n• **PTQ (Post-Training Quantization):** Reduces precision after training. Methods like GPTQ and AWQ are data-aware—they look at a small calibration dataset to protect the most important 'outlier' weights from being rounded into oblivion.\n• **GGUF:** A popular file format that allows running heavily quantized models (e.g., Q4_K_M) efficiently on consumer hardware (MacBooks and CPU/RAM).",
        anim: null,
        math: null
      },
      {
        id: "specdecode",
        title: "Speculative Decoding",
        body: "Inference is memory-bandwidth bound, not compute bound. When generating a token, the GPU does a massive matrix multiplication but only processes batch-size 1. Most of the compute capacity sits idle.\n\nSpeculative Decoding fixes this by pairing a small, fast 'draft' model with the massive 'target' model.\n1. The draft model rapidly generates 4-5 tokens.\n2. The target model processes all 4-5 tokens in a single parallel forward pass to verify them.\n3. Because LLMs run faster in parallel (prefill) than sequentially (decode), this provides a 2-3x speedup with absolutely zero loss in quality—it is mathematically identical to running the target model alone.",
        anim: "specdecode",
        math: null
      },
      {
        id: "vllm",
        title: "Continuous Batching & PagedAttention",
        body: "Serving thousands of users requires batching their requests. But requests arrive at random times and have different lengths.\n\n• **Continuous Batching:** Instead of waiting for a batch to finish, the engine ejects completed requests and inserts new ones at the very next token iteration.\n• **PagedAttention (vLLM, 2023):** Inspired by OS virtual memory. Previously, KV-cache was allocated in massive contiguous blocks, leading to terrible fragmentation (up to 60% memory waste). PagedAttention splits the KV-cache into small blocks (e.g., 16 tokens) that can be stored non-contiguously in VRAM. This tripled serving throughput for the industry.",
        anim: null,
        math: null
      }
    ]
  },
  {
    id: "gaps",
    label: "10 — Critical Gaps & Scaling",
    title: "What Remains Unsolved",
    color: "#E17055",
    icon: "⚠️",
    subs: [
      {
        id: "o2",
        title: "The O(n²) Efficiency Bottleneck",
        body: "Attention computes a relevance score between every pair of tokens: an n×n matrix for a sequence of n tokens. Both compute (O(n²) multiply-adds) and memory (O(n²) matrix storage) scale quadratically.\n\nThe KV-cache problem: during autoregressive inference, the keys and values for every past token are cached to avoid recomputation. For a 70B model at 128K context in fp16, this cache can exceed 128GB — more than fits on most GPU clusters. The cache is the dominant memory cost at long contexts.\n\nFlashAttention (Dao et al., 2022): IO-aware algorithm that never materializes the full N×N attention matrix in slow high-bandwidth memory (HBM). Instead, it tiles computation into blocks fitting in fast on-chip SRAM, computing attention with an online-softmax algorithm. Cuts memory traffic 10–20× and gives ~7.6× wall-clock speedup on attention. Critically: it does NOT change the O(n²) complexity class. FlashAttention-2 and -3 extend these gains to newer GPU architectures.",
        anim: "o2",
        math: {
          eqs: [
            {
              l: "Attention matrix memory",
              t: "\\text{Mem}=O(n^2) \\text{ bytes for length }n"
            },
            {
              l: "KV-cache size",
              t: "2\\times L\\times H\\times d_k\\times T\\times B\\times\\text{sizeof}(\\text{dtype})"
            }
          ]
        }
      },
      {
        id: "ruler",
        title: "RULER: Nominal vs. Functional Context",
        body: "The RULER benchmark (Hsieh et al., 2024) exposed the gap between a model's claimed context window and its functional context — the length over which it can actually reason reliably.\n\nRULER goes beyond simple Needle-in-a-Haystack (NIAH) — where a key fact is planted in a long document — to 13 task types: multi-hop tracing (follow chains of references), aggregation (count all occurrences), variable tracking, and selective filtering, all tested from 4K to 128K tokens.\n\nHeadline finding: of 17 long-context models benchmarked, only half could effectively handle 32K tokens despite all advertising 32K+. GPT-4 degraded least but still dropped 15.4 points from 4K to 128K. Most models show a sharp performance cliff well before their advertised limit.\n\nMRCR v2 (Multi-Range Context Retrieval): tests finding and integrating multiple non-adjacent pieces of evidence — significantly harder than single-needle NIAH and a better proxy for real-world usage.",
        anim: "ruler",
        math: {
          eqs: [
            {
              l: "Functional Context",
              t: "C_{eff} = \\max \\{L \\mid \\text{Accuracy}(L) > \\tau\\}"
            }
          ]
        }
      },
      {
        id: "ssa",
        title: "SSA/SubQ — The 2026 Efficiency Case Study",
        body: "SubQ (Subquadratic Sparse Attention, 2026) represents the newest architectural bet: content-dependent sparse attention that selects which positions matter for each query, computing exact (not approximated) attention only over those positions. This aims to preserve the retrieval precision of full attention while achieving sub-quadratic scaling.\n\nVendor-published figures (May 2026, from an Appen white paper):\n• 56.2× prefill speedup at 1M tokens vs FlashAttention-2 (21,410ms → 380.96ms on B200)\n• 62.8× reduction in attention FLOPs at 1M tokens\n• RULER@128K: 95.6%   •   MRCR v2: 86.2%   •   SWE-Bench Verified: 81.8%\n\nArchitectural position: distinct from prior approaches — unlike fixed-pattern sparsity (Longformer/BigBird) its routing is content-driven; unlike SSMs it preserves exact arbitrary-position retrieval; unlike hybrids (Jamba) it has no load-bearing dense attention layers.\n\n⚠ These are vendor-published figures pending broad independent reproduction as of mid-2026.",
        anim: "ssa",
        math: {
          eqs: [
            {
              l: "Reported speedup @ 1M tokens",
              t: "\\frac{21{,}410\\text{ms (FA2)}}{380.96\\text{ms (SSA)}}\\approx 56.2\\times"
            }
          ]
        }
      },
      {
        id: "datawall",
        title: "The Data Wall",
        body: "Epoch AI's analysis ('Will We Run Out of Data?', Villalobos et al.) estimates the effective stock of quality, repetition-adjusted human-generated public text at approximately 300 trillion tokens, with a 90% CI spanning 100T–1000T.\n\nTheir projection: this stock will be fully utilized between 2026 and 2032, with a median around 2028 — possibly sooner if training continues at the 'overtrained' rate. LLaMA 3 was estimated to be trained ~10× the Chinchilla-optimal number of passes on some datasets.\n\nMitigations under active research:\n• Synthetic data: generate training data using existing models — especially valuable for math, code, and reasoning where correctness is verifiable\n• Multimodal data: video, images, and audio are largely untapped\n• Data efficiency: architectural improvements that learn better from fewer tokens\n• Curriculum learning: better ordering and weighting of training examples",
        anim: "datawall",
        math: {
          eqs: [
            {
              l: "Utilization Curve",
              t: "D_{avail}(t) = D_0 \\cdot e^{k \\cdot (t - t_0)}"
            }
          ]
        }
      },
      {
        id: "interp",
        title: "The Interpretability Deficit & Alignment Gap",
        body: "We cannot reliably explain what individual attention heads, neurons, or layers 'do' in a trained model. We can detect that a layer encodes syntactic structure using probing classifiers, but we cannot trace a specific output to specific mechanisms with confidence.\n\nCurrent research directions:\n• Sparse Autoencoders (SAEs): decompose residual-stream activations into monosemantic 'features' — units that activate for specific interpretable concepts (e.g., 'this token is part of a DNA sequence'). More interpretable than raw neurons, which tend to be polysemantic.\n• Circuit analysis: identify the minimal set of attention heads and MLP neurons implementing a specific capability.\n• Probing: train linear classifiers on hidden states to detect what information is encoded at each layer.\n\nThe alignment gap: RLHF and DPO successfully align surface behavior — models follow instructions, refuse harmful requests, sound more helpful. But they do not reliably fix factual accuracy. An RLHF-trained model can be confidently and fluently wrong. The mechanisms for truthfulness and for instruction-following are largely orthogonal.",
        anim: "sae",
        math: {
          eqs: [
            {
              l: "Probing Classifier",
              t: "\\min_W \\sum_i L(W h_i, y_i) + \\lambda ||W||^2"
            }
          ]
        }
      },
      {
        id: "haltax",
        title: "Hallucination Taxonomy",
        body: "Hallucinations are not bugs in the code; they are a fundamental consequence of how next-token prediction works. They fall into distinct categories:\n\n• **Closed-Domain (Factual Contradiction):** The model contradicts information directly provided in the prompt.\n• **Open-Domain (World Knowledge):** The model confidently states something factually incorrect about the world.\n• **Logical (Reasoning Flaw):** The model makes a mathematical or deductive error.\n\nThe root cause: LLMs do not have a grounded world model or a 'database of truth'. They have a statistical map of language. When they don't 'know' an answer, they don't naturally output 'I don't know' unless heavily RLHF-trained to do so. Instead, they sample the most plausible-sounding tokens, which seamlessly constructs a lie.",
        anim: null,
        math: null
      },
      {
        id: "goodhart",
        title: "Benchmark Saturation & Goodhart's Law",
        body: "'When a measure becomes a target, it ceases to be a good measure.'\n\nClassic benchmarks like MMLU (Massive Multitask Language Understanding) are increasingly saturated (models scoring 90%+). However, this often doesn't correlate with real-world usefulness.\n\nTwo problems:\n1. **Data Contamination:** Benchmark questions frequently leak into the massive pre-training sets. The model isn't reasoning; it's retrieving memorized answers.\n2. **Over-optimization:** RLHF and specialized fine-tuning heavily optimize for benchmark formats (like multiple choice) at the expense of general capabilities (the 'alignment tax').",
        anim: null,
        math: null
      }
    ]
  },
  {
    id: "scaling",
    label: "11 — Scaling Laws",
    title: "The Economics of Scale",
    color: "#74B9FF",
    icon: "📈",
    subs: [
      {
        id: "kaplan",
        title: "Kaplan Scaling Laws (2020)",
        body: "Kaplan et al. (OpenAI, 2020) showed that the test loss of language models follows smooth power laws in model size N, dataset size D, and compute budget C — independently and over many orders of magnitude.\n\nThe key insight: these power laws are stable and predictable, allowing reliable extrapolation. You can train many small models, fit the power law, and forecast how a model 100× larger will perform before spending the compute to train it. This predictability justified massive long-horizon investment.\n\nImplication at the time: maximize model size given compute (data was considered secondary). This logic led to GPT-3 (175B parameters trained on ~300B tokens) and other large, relatively undertrained models.",
        anim: "scaling",
        math: {
          eqs: [
            {
              l: "Loss vs. model size",
              t: "L(N)\\propto N^{-\\alpha_N},\\; \\alpha_N\\approx 0.076"
            },
            {
              l: "Loss vs. data",
              t: "L(D)\\propto D^{-\\alpha_D},\\; \\alpha_D\\approx 0.095"
            },
            {
              l: "Loss vs. compute",
              t: "L(C)\\propto C^{-\\alpha_C},\\; \\alpha_C\\approx 0.050"
            }
          ]
        }
      },
      {
        id: "chinchilla",
        title: "Chinchilla Scaling Laws (2022) — The Correction",
        body: "Hoffmann et al. (DeepMind, 2022) ran a rigorous compute-optimal study: train 400+ models from 70M to 16B parameters on 5B to 500B tokens under fixed compute budgets. Question: given a budget of C FLOPs, what is the optimal model size N* and dataset size D*?\n\nResult: models and data should scale equally. For every doubling of model size, double the training tokens. The Chinchilla-optimal ratio is approximately 20 tokens per parameter (Epoch AI 2024 replication: ~25.6 tokens/param).\n\nConsequence: Chinchilla (70B, 1.4T tokens) outperformed Gopher (280B, 300B tokens) and GPT-3 (175B, 300B tokens) at equal compute. Most large models of 2020–2022 were severely undertrained.\n\nPost-Chinchilla industry shift: LLaMA 3 70B was trained on 15T tokens (~214 tokens/param) — deliberately overtrained relative to Chinchilla to maximize inference efficiency. A smaller model that performs well enough at lower per-token inference cost is often more economical than the compute-optimal trained model.",
        anim: "chinchilla",
        math: {
          eqs: [
            {
              l: "Optimal data-to-param ratio",
              t: "D^*\\approx 20\\times N^*"
            },
            {
              l: "Both scale equally",
              t: "N^*(C)\\propto C^{1/2},\\quad D^*(C)\\propto C^{1/2}"
            }
          ]
        }
      },
      {
        id: "timeline",
        title: "The Model Size Timeline",
        body: "GPT-1: 117M (2018) → BERT-Large: 340M → GPT-2: 1.5B (2019) → T5-11B → GPT-3: 175B (2020) → Megatron-Turing: 530B (2021) → PaLM: 540B (2022) → GPT-4: ~1.8T total/~280B active (rumored MoE, 2023, unconfirmed by OpenAI) → DeepSeek-V3: 671B/37B active (2024/25).\n\nKey inflection point: after GPT-3/PaLM, the frontier pivoted from dense scaling toward MoE — total parameters and active compute diverge dramatically. A 671B parameter model with 37B active compute per token is operationally much cheaper to run than a 671B dense model.\n\nOpen models (LLaMA 3 70B/405B, Qwen 2.5 72B, Mistral Large, DeepSeek-V3) have dramatically closed the capability gap with closed frontier models — a remarkable democratization enabled by the Chinchilla insight and open-source infrastructure.",
        anim: "timeline",
        math: {
          eqs: [
            {
              l: "FLOPs Estimate",
              t: "C \\approx 6 N D"
            }
          ]
        }
      }
    ]
  },
  {
    id: "implications",
    label: "12 — Implications",
    title: "What It Means & Where It's Going",
    color: "#55EFC4",
    icon: "🔭",
    subs: [
      {
        id: "leverage",
        title: "Highest-Leverage Research Directions",
        body: "Based on the current landscape, these interventions have the highest expected return:\n\n1. Efficient long-context architectures — SSMs, content-dependent sparse attention (SSA/SubQ direction), and hybrid models. Directly addresses the O(n²) structural bottleneck, the biggest remaining architectural constraint.\n\n2. Tokenization reform — byte-level or character-level processing with efficient architectures would eliminate glitch tokens, multilingual inefficiency, and arithmetic/code representation pathologies.\n\n3. Training stability at scale — better optimizers (Muon, Sophia second-order methods, MuonClip) and gradient management reduce expensive restarts from loss spikes.\n\n4. Mechanistic interpretability — sparse autoencoders, circuit analysis, and probing are maturing toward engineering tools. Scalable interpretability is a prerequisite for trustworthy deployment at scale.\n\n5. Beyond next-token prediction — world-model objectives, multi-token prediction, and causal reasoning training signals may produce qualitatively more robust and compositional representations.\n\n6. Data quality over quantity — as the data wall approaches, synthetic data generation, rigorous curation pipelines, and data-efficient training curricula become the key differentiator between organizations.",
        anim: null,
        math: {
          eqs: [
            {
              l: "Scaling Axes",
              t: "\\text{Compute}_{total} = \\text{Compute}_{train} + \\text{Compute}_{infer}"
            }
          ]
        }
      },
      {
        id: "future",
        title: "A Desired Future State & Its Obstacles",
        body: "A positive future for LLM development would involve:\n• Architectural pluralism: no single family dominates — SSMs for streaming long-context, sparse MoE for knowledge-intensive tasks, dense models for low-latency inference\n• Transparent training: data provenance documented, architecture details published, evaluation methodology disclosed\n• Democratized access: models efficient enough to run on consumer hardware, removing the GPU-cluster barrier\n• Safety by design: alignment integrated into architecture and training objectives, not only as post-training patches\n• Interpretability as standard: internal representations auditable, circuits documented as engineering deliverables\n\nObstacles:\n• Compute concentration: training frontier models requires $300M–$10B capex, concentrated in 3–4 organizations\n• Incentive misalignment: safety research costs money without directly improving capability benchmarks\n• Path dependency: decades of infrastructure, tooling, and research built around the Transformer are hard to displace\n• Benchmark lock-in: research optimizes for established benchmarks rather than real-world utility\n• Regulatory lag: governance frameworks arrive years after the technology they attempt to govern",
        anim: null,
        math: null
      }
    ]
  }
];







// ─── APPENDIX DATA ───────────────────────────────────────────────────
const APPENDIX={
  "cats": [
    {
      "label": "Foundational Architecture",
      "papers": [
        {
          "a": "Vaswani et al.",
          "t": "Attention Is All You Need",
          "v": "NeurIPS 2017",
          "d": "Introduced the Transformer: self-attention, multi-head attention, sinusoidal PE, encoder-decoder. The mathematical baseline for everything that follows.",
          "url": "https://arxiv.org/abs/1706.03762"
        },
        {
          "a": "Dai et al.",
          "t": "Transformer-XL: Attentive LMs Beyond a Fixed-Length Context",
          "v": "ACL 2019 | arXiv:1901.02860",
          "d": "Segment-level recurrence and relative PE for longer effective context.",
          "url": "https://arxiv.org/abs/1901.02860"
        }
      ]
    },
    {
      "label": "Encoder-Only Models",
      "papers": [
        {
          "a": "Devlin et al.",
          "t": "BERT: Pre-training of Deep Bidirectional Transformers",
          "v": "NAACL 2019 | arXiv:1810.04805",
          "d": "MLM + NSP, bidirectional understanding, [CLS] token. Defined encoder-only pre-training.",
          "url": "https://arxiv.org/abs/1810.04805"
        },
        {
          "a": "Liu et al.",
          "t": "RoBERTa: A Robustly Optimized BERT Pretraining Approach",
          "v": "arXiv:1907.11692, 2019",
          "d": "Dynamic masking, no NSP, larger batches. Rigorous ablation showing what actually matters in BERT.",
          "url": "https://arxiv.org/abs/1907.11692"
        },
        {
          "a": "Yang et al.",
          "t": "XLNet: Generalized Autoregressive Pretraining",
          "v": "NeurIPS 2019 | arXiv:1906.08237",
          "d": "Permutation language modeling — combines autoregressive and autoencoding strengths.",
          "url": "https://arxiv.org/abs/1906.08237"
        }
      ]
    },
    {
      "label": "Decoder-Only Models",
      "papers": [
        {
          "a": "Radford et al.",
          "t": "Language Models are Unsupervised Multitask Learners (GPT-2)",
          "v": "OpenAI, 2019",
          "d": "Scale alone yields zero-shot task transfer; sparked debate about emergent abilities."
        },
        {
          "a": "Brown et al.",
          "t": "Language Models are Few-Shot Learners (GPT-3)",
          "v": "NeurIPS 2020 | arXiv:2005.14165",
          "d": "175B in-context learning at scale. Defining paper of the modern LLM era.",
          "url": "https://arxiv.org/abs/2005.14165"
        },
        {
          "a": "Touvron et al.",
          "t": "LLaMA: Open and Efficient Foundation Language Models",
          "v": "arXiv:2302.13971, 2023",
          "d": "Catalyzed open-weights ecosystem; canonical modern decoder stack (RMSNorm, SwiGLU, RoPE, Pre-Norm).",
          "url": "https://arxiv.org/abs/2302.13971"
        }
      ]
    },
    {
      "label": "Encoder-Decoder Models",
      "papers": [
        {
          "a": "Raffel et al.",
          "t": "Exploring the Limits of Transfer Learning with T5",
          "v": "JMLR 2020 | arXiv:1910.10683",
          "d": "Unified all NLP as text-to-text; span corruption pre-training; still strong baseline for seq2seq.",
          "url": "https://arxiv.org/abs/1910.10683"
        },
        {
          "a": "Lewis et al.",
          "t": "BART: Denoising Sequence-to-Sequence Pre-training",
          "v": "ACL 2020 | arXiv:1910.13461",
          "d": "Denoising autoencoder; strong for abstractive summarization.",
          "url": "https://arxiv.org/abs/1910.13461"
        }
      ]
    },
    {
      "label": "Mixture of Experts",
      "papers": [
        {
          "a": "Fedus et al.",
          "t": "Switch Transformers: Scaling to Trillion Parameter Models",
          "v": "JMLR 2022 | arXiv:2101.03961",
          "d": "Simplified top-1 routing; trillion-parameter scale; established MoE as production-viable.",
          "url": "https://arxiv.org/abs/2101.03961"
        },
        {
          "a": "DeepSeek-AI",
          "t": "DeepSeek-V3 Technical Report",
          "v": "arXiv:2412.19437, 2024",
          "d": "MLA + fine-grained MoE (256+1 experts, 8 active); auxiliary-loss-free load balancer; 14.8T tokens in 2.788M H800 GPU-hours.",
          "url": "https://arxiv.org/abs/2412.19437"
        }
      ]
    },
    {
      "label": "State Space Models & Linear Architectures",
      "papers": [
        {
          "a": "Gu et al.",
          "t": "Efficiently Modeling Long Sequences with Structured State Spaces (S4)",
          "v": "ICLR 2022 | arXiv:2111.00396",
          "d": "HiPPO matrix initialization; convolution/recurrence duality; established SSM framework.",
          "url": "https://arxiv.org/abs/2111.00396"
        },
        {
          "a": "Gu & Dao",
          "t": "Mamba: Linear-Time Sequence Modeling with Selective State Spaces",
          "v": "arXiv:2312.00752, 2023",
          "d": "Input-dependent SSM; hardware-aware parallel scan; O(n) inference; 5× throughput vs Transformers.",
          "url": "https://arxiv.org/abs/2312.00752"
        },
        {
          "a": "Peng et al.",
          "t": "RWKV: Reinventing RNNs for the Transformer Era",
          "v": "EMNLP 2023 | arXiv:2305.13048",
          "d": "Trainable in parallel; runs as RNN at inference; WKV time-mixing with learned per-channel decay.",
          "url": "https://arxiv.org/abs/2305.13048"
        },
        {
          "a": "Sun et al.",
          "t": "Retentive Network: A Successor to Transformer for LLMs",
          "v": "arXiv:2307.08621, 2023",
          "d": "Three equivalent forms (parallel/recurrent/chunk-wise); exponential decay retention mechanism.",
          "url": "https://arxiv.org/abs/2307.08621"
        },
        {
          "a": "Katharopoulos et al.",
          "t": "Transformers are RNNs: Fast Autoregressive Transformers with Linear Attention",
          "v": "ICML 2020 | arXiv:2006.16236",
          "d": "Kernel-based linear attention achieving O(n); established linear attention literature.",
          "url": "https://arxiv.org/abs/2006.16236"
        }
      ]
    },
    {
      "label": "Tokenization",
      "papers": [
        {
          "a": "Sennrich et al.",
          "t": "Neural Machine Translation of Rare Words with Subword Units (BPE)",
          "v": "ACL 2016 | arXiv:1508.07909",
          "d": "Adapted BPE compression algorithm to NLP; defined subword tokenization paradigm.",
          "url": "https://arxiv.org/abs/1508.07909"
        },
        {
          "a": "Kudo",
          "t": "Subword Regularization: Improving NMT with Multiple Subword Candidates",
          "v": "ACL 2018 | arXiv:1804.10959",
          "d": "Probabilistic unigram tokenization via EM pruning; enables sampling for regularization.",
          "url": "https://arxiv.org/abs/1804.10959"
        },
        {
          "a": "Kudo & Richardson",
          "t": "SentencePiece: A simple and language independent subword tokenizer",
          "v": "EMNLP 2018 | arXiv:1808.06226",
          "d": "Language-independent framework; spaces marked as ▁; universally used for multilingual models.",
          "url": "https://arxiv.org/abs/1808.06226"
        },
        {
          "a": "Xue et al.",
          "t": "ByT5: Towards a Token-Free Future with Pre-trained Byte-to-Byte Models",
          "v": "TACL 2022 | arXiv:2105.13626",
          "d": "UTF-8 byte processing; vocabulary=256; zero unknown tokens.",
          "url": "https://arxiv.org/abs/2105.13626"
        }
      ]
    },
    {
      "label": "Positional Encoding",
      "papers": [
        {
          "a": "Su et al.",
          "t": "RoFormer: Enhanced Transformer with Rotary Position Embedding (RoPE)",
          "v": "Neurocomputing 2024 | arXiv:2104.09864",
          "d": "Rotation-based PE; dot products encode relative position naturally; now the dominant standard.",
          "url": "https://arxiv.org/abs/2104.09864"
        },
        {
          "a": "Press et al.",
          "t": "Train Short, Test Long: Attention with Linear Biases (ALiBi)",
          "v": "ICLR 2022 | arXiv:2108.12409",
          "d": "Adds linear distance penalty to attention scores; strong length extrapolation without PE.",
          "url": "https://arxiv.org/abs/2108.12409"
        },
        {
          "a": "Peng et al.",
          "t": "YaRN: Efficient Context Window Extension of Large Language Models",
          "v": "ICLR 2024 | arXiv:2309.00071",
          "d": "Extends RoPE beyond training length; ~2.5× fewer fine-tuning steps than position interpolation.",
          "url": "https://arxiv.org/abs/2309.00071"
        }
      ]
    },
    {
      "label": "Normalization & Activation Functions",
      "papers": [
        {
          "a": "Ba et al.",
          "t": "Layer Normalization",
          "v": "arXiv:1607.06450, 2016",
          "d": "Introduced LayerNorm; normalized across feature dimension; essential for Transformer training.",
          "url": "https://arxiv.org/abs/1607.06450"
        },
        {
          "a": "Hendrycks & Gimpel",
          "t": "Gaussian Error Linear Units (GELUs)",
          "v": "arXiv:1606.08415, 2016",
          "d": "Smooth stochastic gating; empirically outperforms ReLU in Transformers.",
          "url": "https://arxiv.org/abs/1606.08415"
        },
        {
          "a": "Zhang & Sennrich",
          "t": "Root Mean Square Layer Normalization",
          "v": "NeurIPS 2019 | arXiv:1910.07467",
          "d": "Drops mean-centering; computationally cheaper; quality matches LayerNorm. Now standard.",
          "url": "https://arxiv.org/abs/1910.07467"
        },
        {
          "a": "Shazeer",
          "t": "GLU Variants Improve Transformer",
          "v": "arXiv:2002.05202, 2020",
          "d": "Introduced SwiGLU, GeGLU; SwiGLU is now the de-facto activation standard.",
          "url": "https://arxiv.org/abs/2002.05202"
        }
      ]
    },
    {
      "label": "Scaling Laws",
      "papers": [
        {
          "a": "Kaplan et al.",
          "t": "Scaling Laws for Neural Language Models",
          "v": "arXiv:2001.08361, 2020",
          "d": "Power-law relationships between N, D, C, and loss; justified massive scaling investment.",
          "url": "https://arxiv.org/abs/2001.08361"
        },
        {
          "a": "Hoffmann et al.",
          "t": "Training Compute-Optimal Large Language Models (Chinchilla)",
          "v": "NeurIPS 2022 | arXiv:2203.15556",
          "d": "Revised scaling: model and data should scale equally at ~20 tokens/param.",
          "url": "https://arxiv.org/abs/2203.15556"
        }
      ]
    },
    {
      "label": "Post-Training & Alignment",
      "papers": [
        {
          "a": "Ouyang et al.",
          "t": "Training LMs to Follow Instructions with Human Feedback (InstructGPT)",
          "v": "NeurIPS 2022 | arXiv:2203.02155",
          "d": "Foundational RLHF: SFT → reward model → PPO; the template for instruction tuning.",
          "url": "https://arxiv.org/abs/2203.02155"
        },
        {
          "a": "Rafailov et al.",
          "t": "Direct Preference Optimization (DPO)",
          "v": "NeurIPS 2023 | arXiv:2305.18290",
          "d": "Bypasses RL loop; directly optimizes preference loss from human preference labels.",
          "url": "https://arxiv.org/abs/2305.18290"
        },
        {
          "a": "Bai et al.",
          "t": "Constitutional AI: Harmlessness from AI Feedback",
          "v": "arXiv:2212.08073, 2022",
          "d": "Replaces human preference labels with AI critique guided by a written constitution.",
          "url": "https://arxiv.org/abs/2212.08073"
        }
      ]
    },
    {
      "label": "Efficiency Optimizations",
      "papers": [
        {
          "a": "Dao et al.",
          "t": "FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness",
          "v": "NeurIPS 2022 | arXiv:2205.14135",
          "d": "IO-aware tiled attention; never materializes O(n²) matrix in HBM; 10-20× memory reduction.",
          "url": "https://arxiv.org/abs/2205.14135"
        },
        {
          "a": "Dao",
          "t": "FlashAttention-2: Faster Attention with Better Parallelism",
          "v": "ICLR 2024 | arXiv:2307.08691",
          "d": "~2× speedup over FA1 via improved thread scheduling on modern GPUs.",
          "url": "https://arxiv.org/abs/2307.08691"
        },
        {
          "a": "Liu et al.",
          "t": "LoRA: Low-Rank Adaptation of Large Language Models",
          "v": "ICLR 2022 | arXiv:2106.09685",
          "d": "PEFT via low-rank weight decomposition; changed fine-tuning economics.",
          "url": "https://arxiv.org/abs/2106.09685"
        }
      ]
    },
    {
      "label": "Evaluation & Benchmarks",
      "papers": [
        {
          "a": "Hsieh et al.",
          "t": "RULER: What's the Real Context Size of Your Long-Context Language Models?",
          "v": "COLM 2024 | arXiv:2404.06654",
          "d": "13-task benchmark; exposed the nominal-vs-functional context gap across 17 models.",
          "url": "https://arxiv.org/abs/2404.06654"
        },
        {
          "a": "Liu et al.",
          "t": "Lost in the Middle: How LMs Use Long Contexts",
          "v": "TACL 2024",
          "d": "Models attend well to start/end but systematically miss material in the middle."
        },
        {
          "a": "Hendrycks et al.",
          "t": "Measuring Massive Multitask Language Understanding (MMLU)",
          "v": "ICLR 2021 | arXiv:2009.03300",
          "d": "57-subject knowledge benchmark; near-saturated by 2024, motivating harder successors.",
          "url": "https://arxiv.org/abs/2009.03300"
        }
      ]
    },
    {
      "label": "Recent Surveys (2024–2026)",
      "papers": [
        {
          "a": "Sun et al.",
          "t": "Speed Always Wins: A Survey on Efficient Architectures for LLMs",
          "v": "arXiv:2508.09834, 2025",
          "d": "Seven categories of efficient architectures; comprehensive 2025 taxonomy.",
          "url": "https://arxiv.org/abs/2508.09834"
        },
        {
          "a": "Patro & Agneeswaran",
          "t": "LLMOrbit: A Circular Taxonomy of Large Language Models",
          "v": "arXiv:2601.14053, 2026",
          "d": "50+ models across 8 orbital dimensions; maps the full 2026 architectural landscape.",
          "url": "https://arxiv.org/abs/2601.14053"
        }
      ]
    }
  ]
};


const GLOSSARY=[
  {term:"Autoregressive",def:"A model that predicts future values based on past values. In LLMs, predicting the next token given previous tokens."},
  {term:"KV-Cache",def:"Storing the Keys and Values of past tokens during inference so they don't need to be recomputed for every new token."},
  {term:"MoE (Mixture of Experts)",def:"An architecture where only a subset of the network's parameters (experts) are activated for any given token, saving compute."},
  {term:"Perplexity (PPL)",def:"A measurement of how well a probability model predicts a sample. Lower is better. Mathematically, the exponentiated cross-entropy loss."},
  {term:"RoPE (Rotary Position Embedding)",def:"A method to inject positional information by rotating the queries and keys in the complex plane, allowing relative distances to emerge naturally."},
  {term:"Speculative Decoding",def:"Using a small, fast model to guess multiple future tokens, and a large, slow model to verify them all at once in parallel."},
  {term:"RLHF",def:"Reinforcement Learning from Human Feedback. Training a model to maximize a reward signal derived from human preference rankings."}
];

dlSections=new Set(SECTIONS.map(s=>s.id));
// ─── HELPER ─────────────────────────────────────────────────────────
function rr(ctx,x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}
function escHtml(s){const d=document.createElement('div');d.textContent=s;return d.innerHTML;}

// ─── ANIMATIONS ──────────────────────────────────────────────────────
const ANIMS={
  token_pred:(ctx,w,h,t)=>{
    ctx.clearRect(0,0,w,h);
    const toks=["The","quick","brown","fox","[?]"],cols=["#6C63FF","#6C63FF","#6C63FF","#6C63FF","#00C9A7"];
    const tw=60,th=32,g=10,sx=(w-toks.length*(tw+g))/2,y=22;
    toks.forEach((tok,i)=>{
      const pulse=i===4?Math.abs(Math.sin(t*2)):1;
      ctx.globalAlpha=pulse;
      ctx.fillStyle=i===4?"rgba(0,201,167,.18)":"rgba(108,99,255,.1)";
      ctx.strokeStyle=i===4?"#00C9A7":"#6C63FF44";ctx.lineWidth=i===4?2:1.5;
      rr(ctx,sx+i*(tw+g),y,tw,th,6);ctx.fill();ctx.stroke();
      ctx.fillStyle=i===4?"#00C9A7":"#c8d0e8";
      ctx.font=(i===4?"bold ":"")+"12px 'JetBrains Mono'";
      ctx.textAlign="center";ctx.textBaseline="middle";
      ctx.fillText(tok,sx+i*(tw+g)+tw/2,y+th/2);
      ctx.globalAlpha=1;
    });
    ctx.textBaseline="alphabetic";
    const probs=[["over",.62],["around",.2],["off",.1],["away",.08]];
    const bx=sx+4*(tw+g),by=y+th+20;
    probs.forEach(([word,p],i)=>{
      const bw=128*p*Math.min(t*1.5,1);
      ctx.fillStyle="rgba(0,201,167,.12)";ctx.fillRect(bx,by+i*24,128,18);
      ctx.fillStyle="#00C9A7";ctx.fillRect(bx,by+i*24,bw,18);
      ctx.fillStyle="#e8eaf0";ctx.font="10px 'JetBrains Mono'";ctx.textAlign="left";ctx.textBaseline="middle";
      ctx.fillText(word,bx+4,by+i*24+9);ctx.textAlign="right";
      ctx.fillText((p*100).toFixed(0)+"%",bx+124,by+i*24+9);ctx.textBaseline="alphabetic";
    });
  },
  param_scale:(ctx,w,h,t)=>{
    ctx.clearRect(0,0,w,h);
    const ms=[{n:"GPT-1\n117M",p:.117,c:"#74B9FF"},{n:"BERT\n340M",p:.34,c:"#A29BFE"},{n:"GPT-2\n1.5B",p:1.5,c:"#6C63FF"},{n:"GPT-3\n175B",p:175,c:"#FD79A8"},{n:"PaLM\n540B",p:540,c:"#E17055"},{n:"DSV3\n37B active",p:37,c:"#00C9A7"}];
    const maxP=600,bw=40,gap=16,sx=(w-ms.length*(bw+gap))/2,maxH=h-72;
    ms.forEach((m,i)=>{
      const bh=(m.p/maxP)*maxH*Math.min(t*.5,1);
      const x=sx+i*(bw+gap),y=h-50-bh;
      ctx.fillStyle=m.c+"18";ctx.fillRect(x,h-50-maxH,bw,maxH);
      ctx.fillStyle=m.c+"66";ctx.fillRect(x,y,bw,bh);
      ctx.fillStyle=m.c;ctx.fillRect(x,y,bw,3);
      ctx.fillStyle="#e8eaf0";ctx.font="bold 9px 'JetBrains Mono'";ctx.textAlign="center";
      if(bh>18)ctx.fillText(m.p+"B",x+bw/2,y-6);
      ctx.fillStyle="#6b7394";ctx.font="8.5px 'JetBrains Mono'";
      m.n.split("\n").forEach((l,li)=>ctx.fillText(l,x+bw/2,h-30+li*12));
    });
  },
  phases:(ctx,w,h,t)=>{
    ctx.clearRect(0,0,w,h);
    const ps=[{n:"Pre-training",s:"Trillions of tokens",c:"#6C63FF",e:"📚"},{n:"Fine-tuning",s:"RLHF / DPO / SFT",c:"#00C9A7",e:"🎯"},{n:"Inference",s:"Frozen weights",c:"#F7B731",e:"⚡"}];
    const pw=(w-80)/3,ph=90,y=(h-ph)/2,g=20;
    ps.forEach((p,i)=>{
      const x=20+i*(pw+g),a=Math.min((t*1.5-i*.4),1);
      if(a<=0)return;
      ctx.globalAlpha=Math.max(0,a);
      ctx.fillStyle=p.c+"14";ctx.strokeStyle=p.c+"55";ctx.lineWidth=1.5;
      rr(ctx,x,y,pw,ph,10);ctx.fill();ctx.stroke();
      ctx.font="18px serif";ctx.textAlign="center";ctx.fillStyle="#fff";ctx.fillText(p.e,x+pw/2,y+26);
      ctx.fillStyle="#e8eaf0";ctx.font="bold 12px 'Space Grotesk'";ctx.fillText(p.n,x+pw/2,y+48);
      ctx.fillStyle="#6b7394";ctx.font="10.5px 'Space Grotesk'";ctx.fillText(p.s,x+pw/2,y+66);
      if(i<2){
        ctx.strokeStyle="#2a3050";ctx.lineWidth=1.5;ctx.setLineDash([4,4]);
        ctx.beginPath();ctx.moveTo(x+pw+2,y+ph/2);ctx.lineTo(x+pw+g-2,y+ph/2);ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.globalAlpha=1;
    });
  },
  ngram:(ctx,w,h,t)=>{
    ctx.clearRect(0,0,w,h);
    const s=["The","cat","sat","on","the","mat"],tw=52,th=30,g=8,sx=(w-s.length*(tw+g))/2,y=28;
    s.forEach((word,i)=>{
      ctx.fillStyle="rgba(108,99,255,.1)";ctx.strokeStyle="#6C63FF30";ctx.lineWidth=1;
      rr(ctx,sx+i*(tw+g),y,tw,th,5);ctx.fill();ctx.stroke();
      ctx.fillStyle="#c8d0e8";ctx.font="12px 'JetBrains Mono'";ctx.textAlign="center";ctx.textBaseline="middle";
      ctx.fillText(word,sx+i*(tw+g)+tw/2,y+th/2);ctx.textBaseline="alphabetic";
    });
    const fi=Math.floor((t*.7)%5),pair=[fi,fi+1];
    pair.forEach(i=>{
      ctx.fillStyle="rgba(0,201,167,.22)";ctx.strokeStyle="#00C9A7";ctx.lineWidth=2;
      rr(ctx,sx+i*(tw+g),y,tw,th,5);ctx.fill();ctx.stroke();
    });
    ctx.fillStyle="#6b7394";ctx.font="11px 'Space Grotesk'";ctx.textAlign="center";
    ctx.fillText(`P("${s[pair[1]]}" | "${s[pair[0]]}") = count(pair) / count(first)`,w/2,y+th+28);
  },
  w2v:(ctx,w,h,t)=>{
    ctx.clearRect(0,0,w,h);
    const pts=[{w:"king",x:.2,y:.22,c:"#6C63FF"},{w:"queen",x:.2,y:.58,c:"#FD79A8"},{w:"man",x:.65,y:.22,c:"#6C63FF"},{w:"woman",x:.65,y:.58,c:"#FD79A8"},{w:"river",x:.42,y:.82,c:"#00C9A7"},{w:"bank",x:.14,y:.82,c:"#F7B731"}];
    for(let i=0;i<=4;i++){ctx.strokeStyle="rgba(255,255,255,.04)";ctx.lineWidth=.5;ctx.beginPath();ctx.moveTo(i*w/4,0);ctx.lineTo(i*w/4,h);ctx.stroke();ctx.beginPath();ctx.moveTo(0,i*h/4);ctx.lineTo(w,i*h/4);ctx.stroke();}
    const r=Math.min(t*.6,1);
    if(r>.3){ctx.strokeStyle="#A29BFE55";ctx.lineWidth=1.5;ctx.setLineDash([4,4]);[[0,1],[2,3],[0,2],[1,3]].forEach(([a,b])=>{ctx.beginPath();ctx.moveTo(pts[a].x*w,pts[a].y*h);ctx.lineTo(pts[b].x*w,pts[b].y*h);ctx.stroke();});ctx.setLineDash([]);}
    pts.forEach(p=>{
      ctx.fillStyle=p.c+"30";ctx.strokeStyle=p.c;ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(p.x*w,p.y*h,5,0,Math.PI*2);ctx.fill();ctx.stroke();
      ctx.fillStyle="#e8eaf0";ctx.font="bold 12px 'Space Grotesk'";ctx.textAlign="left";
      ctx.fillText(p.w,p.x*w+9,p.y*h+4);
    });
    ctx.fillStyle="#6b7394";ctx.font="10.5px 'Space Grotesk'";ctx.textAlign="center";
    ctx.fillText("king − man + woman ≈ queen  (the famous Word2Vec analogy)",w/2,h-8);
  },
  rnn:(ctx,w,h,t)=>{
    ctx.clearRect(0,0,w,h);
    const n=5,r=22,g=56,sx=28,y=h*.38,prog=Math.min(t*.55,n-1);
    for(let i=0;i<n;i++){
      const x=sx+i*(r*2+g),act=i<=prog;
      rr(ctx,x-18,y+48,36,24,5);
      ctx.fillStyle=act?"rgba(108,99,255,.28)":"rgba(108,99,255,.06)";ctx.strokeStyle=act?"#6C63FF":"#2a3050";ctx.lineWidth=1.5;
      ctx.fill();ctx.stroke();
      ctx.fillStyle=act?"#b0b8d0":"#2a3050";ctx.font="10px 'JetBrains Mono'";ctx.textAlign="center";ctx.textBaseline="middle";
      ctx.fillText("x"+i,x,y+61);ctx.textBaseline="alphabetic";
      ctx.fillStyle=act?"rgba(0,201,167,.2)":"rgba(0,201,167,.05)";ctx.strokeStyle=act?"#00C9A7":"#1a2828";ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.stroke();
      ctx.fillStyle=act?"#00C9A7":"#1a2828";ctx.font="bold 10px 'JetBrains Mono'";ctx.textAlign="center";ctx.textBaseline="middle";
      ctx.fillText("h"+i,x,y);ctx.textBaseline="alphabetic";
      if(act){ctx.strokeStyle="#6C63FF55";ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x,y+48);ctx.lineTo(x,y+r+2);ctx.stroke();}
      if(i<n-1&&act){const nx=sx+(i+1)*(r*2+g);ctx.strokeStyle="#00C9A766";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(nx-r,y);ctx.stroke();ctx.fillStyle="#00C9A766";ctx.beginPath();ctx.moveTo(nx-r,y-4);ctx.lineTo(nx-r,y+4);ctx.lineTo(nx-r+8,y);ctx.fill();}
      if(i===0&&prog>2){const fade=Math.min((prog-2)*.6,1);ctx.globalAlpha=fade;ctx.fillStyle="#E17055";ctx.font="9px 'Space Grotesk'";ctx.textAlign="center";ctx.fillText("grad→0",x,y-r-8);ctx.globalAlpha=1;}
    }
  },
  lstm:(ctx,w,h,t)=>{
    ctx.clearRect(0,0,w,h);
    const cx=w/2,cy=h*.42,rw=90,rh=52;
    ctx.fillStyle="rgba(108,99,255,.1)";ctx.strokeStyle="#6C63FF";ctx.lineWidth=2;rr(ctx,cx-rw,cy-rh,rw*2,rh*2,10);ctx.fill();ctx.stroke();
    ctx.fillStyle="#c8d0e8";ctx.font="bold 13px 'Space Grotesk'";ctx.textAlign="center";ctx.fillText("LSTM Cell",cx,cy-rh+20);
    const gates=[{n:"Forget",x:cx-65,c:"#FF6B6B",v:Math.abs(Math.sin(t))},{n:"Input",x:cx,c:"#00C9A7",v:Math.abs(Math.cos(t))},{n:"Output",x:cx+65,c:"#F7B731",v:Math.abs(Math.sin(t+1))}];
    gates.forEach(g=>{
      ctx.fillStyle=g.c+"25";ctx.strokeStyle=g.c;ctx.lineWidth=2;ctx.beginPath();ctx.arc(g.x,cy,16,0,Math.PI*2);ctx.fill();ctx.stroke();
      ctx.fillStyle=g.c+"88";ctx.beginPath();ctx.arc(g.x,cy,16*g.v,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="#fff";ctx.font="bold 9px 'JetBrains Mono'";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(g.v.toFixed(1),g.x,cy);ctx.textBaseline="alphabetic";
      ctx.fillStyle="#6b7394";ctx.font="9.5px 'Space Grotesk'";ctx.fillText(g.n,g.x,cy+26);
    });
    ctx.strokeStyle="#A29BFE";ctx.lineWidth=3;ctx.setLineDash([6,3]);ctx.beginPath();ctx.moveTo(cx-rw-18,cy-18);ctx.lineTo(cx+rw+18,cy-18);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle="#A29BFE";ctx.font="9.5px 'Space Grotesk'";ctx.textAlign="center";ctx.fillText("Cell State C_t — additive update path (gradients flow freely)",cx,cy-rh-8);
    ctx.fillStyle="#6b7394";ctx.font="10px 'Space Grotesk'";ctx.textAlign="center";ctx.fillText("σ gates ∈ [0,1]: 0 = forget everything, 1 = keep everything",cx,h-12);
  },
  bahdanau:(ctx,w,h,t)=>{
    ctx.clearRect(0,0,w,h);
    const enc=["I","love","this","model"],tw=44,th=28,ey=24,g=10,sx=(w-enc.length*(tw+g))/2;
    const fi=Math.floor((t*.6)%enc.length);
    enc.forEach((word,i)=>{
      const isF=i===fi;ctx.globalAlpha=isF?1:0.3;
      ctx.fillStyle=isF?"rgba(0,201,167,.25)":"rgba(108,99,255,.08)";ctx.strokeStyle=isF?"#00C9A7":"#6C63FF30";ctx.lineWidth=isF?2:1;
      rr(ctx,sx+i*(tw+g),ey,tw,th,5);ctx.fill();ctx.stroke();
      ctx.fillStyle=isF?"#00C9A7":"#9aa3bf";ctx.font="12px 'JetBrains Mono'";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(word,sx+i*(tw+g)+tw/2,ey+th/2);ctx.textBaseline="alphabetic";ctx.globalAlpha=1;
      if(isF){
        ctx.strokeStyle="#00C9A7";ctx.lineWidth=1.8;ctx.beginPath();ctx.moveTo(sx+i*(tw+g)+tw/2,ey+th);ctx.lineTo(w/2,h-48);ctx.stroke();
        ctx.fillStyle="#F7B731";ctx.font="bold 10px 'JetBrains Mono'";ctx.textAlign="center";
        ctx.fillText("α="+(.4+i*.12).toFixed(2),sx+i*(tw+g)+tw/2+(w/2-sx-i*(tw+g)-tw/2)/2,ey+th+(h-48-ey-th)/2);
      }
    });
    ctx.fillStyle="rgba(247,183,49,.12)";ctx.strokeStyle="#F7B73170";ctx.lineWidth=2;rr(ctx,w/2-42,h-46,84,28,6);ctx.fill();ctx.stroke();
    ctx.fillStyle="#F7B731";ctx.font="bold 12px 'JetBrains Mono'";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("Decoder",w/2,h-32);ctx.textBaseline="alphabetic";
    ctx.fillStyle="#6b7394";ctx.font="10.5px 'Space Grotesk'";ctx.textAlign="center";ctx.fillText("c_t = Σ α_i·h_i — weighted blend of encoder states",w/2,(ey+th+h-46)/2+14);
  },
  seq2seq_bottle:(ctx,w,h,t)=>{
    ctx.clearRect(0,0,w,h);
    const ew=w*.36,eh=40,ex=w*.05,ey=h/2-eh/2,dw=w*.36,dx=w*.59;
    ctx.fillStyle="rgba(108,99,255,.1)";ctx.strokeStyle="#6C63FF";ctx.lineWidth=2;rr(ctx,ex,ey,ew,eh,8);ctx.fill();ctx.stroke();
    ctx.fillStyle="#6C63FF";ctx.font="bold 12px 'Space Grotesk'";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("Encoder RNN",ex+ew/2,ey+eh/2);ctx.textBaseline="alphabetic";
    ctx.fillStyle="rgba(0,201,167,.1)";ctx.strokeStyle="#00C9A7";ctx.lineWidth=2;rr(ctx,dx,ey,dw,eh,8);ctx.fill();ctx.stroke();
    ctx.fillStyle="#00C9A7";ctx.font="bold 12px 'Space Grotesk'";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("Decoder RNN",dx+dw/2,ey+eh/2);ctx.textBaseline="alphabetic";
    const mx=ex+ew+(dx-ex-ew)/2,my=h/2;
    ctx.fillStyle="rgba(247,183,49,.2)";ctx.strokeStyle="#F7B731";ctx.lineWidth=2;ctx.beginPath();ctx.arc(mx,my,14,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.fillStyle="#F7B731";ctx.font="bold 10px 'JetBrains Mono'";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("c",mx,my);ctx.textBaseline="alphabetic";
    ctx.strokeStyle="#F7B731";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(ex+ew,my);ctx.lineTo(mx-14,my);ctx.stroke();ctx.beginPath();ctx.moveTo(mx+14,my);ctx.lineTo(dx,my);ctx.stroke();
    const ts=(t*.5)%1;
    ctx.fillStyle=`rgba(247,183,49,${.8-ts*.5})`;ctx.beginPath();ctx.arc(ex+ew+ts*(dx-ex-ew),my,4,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#FF6B6B";ctx.font="bold 14px 'Space Grotesk'";ctx.textAlign="center";ctx.fillText("BOTTLENECK",mx,my-24);
    ctx.fillStyle="#6b7394";ctx.font="10px 'Space Grotesk'";ctx.textAlign="center";ctx.fillText("All context compressed into 1 vector",mx,my+32);
  },
  enc_dec:(ctx,w,h,t)=>{
    ctx.clearRect(0,0,w,h);
    const ew=w*.36,eh=h*.56,ex=w*.02,ey=(h-eh)/2,dw=w*.36,dy=(h-eh)/2,dx=w*.58;
    ctx.fillStyle="rgba(108,99,255,.1)";ctx.strokeStyle="#6C63FF";ctx.lineWidth=2;rr(ctx,ex,ey,ew,eh,12);ctx.fill();ctx.stroke();
    ctx.fillStyle="#6C63FF";ctx.font="bold 13px 'Space Grotesk'";ctx.textAlign="center";ctx.fillText("ENCODER",ex+ew/2,ey+24);
    ctx.fillStyle="#6b7394";ctx.font="10px 'Space Grotesk'";ctx.fillText("Bidirectional Self-Attn",ex+ew/2,ey+44);
    ["h₁","h₂","h₃","h₄"].forEach((hl,i)=>{const hx=ex+18+i*38,hy=ey+eh-46;ctx.fillStyle="rgba(108,99,255,.28)";ctx.strokeStyle="#6C63FF66";ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(hx,hy,14,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle="#c8d0e8";ctx.font="10px 'JetBrains Mono'";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(hl,hx,hy);ctx.textBaseline="alphabetic";});
    const anim=Math.sin(t*1.5)*.5+.5;
    ctx.strokeStyle=`rgba(0,201,167,${.4+anim*.6})`;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(ex+ew,h/2);ctx.lineTo(dx,h/2);ctx.stroke();
    ctx.fillStyle=`rgba(0,201,167,${.4+anim*.6})`;ctx.beginPath();ctx.moveTo(dx,h/2-5);ctx.lineTo(dx,h/2+5);ctx.lineTo(dx+8,h/2);ctx.fill();
    ctx.fillStyle="#00C9A7";ctx.font="9.5px 'Space Grotesk'";ctx.textAlign="center";ctx.fillText("cross-attn",ex+ew+(dx-ex-ew)/2,h/2-10);
    ctx.fillStyle="rgba(0,201,167,.1)";ctx.strokeStyle="#00C9A7";ctx.lineWidth=2;rr(ctx,dx,dy,dw,eh,12);ctx.fill();ctx.stroke();
    ctx.fillStyle="#00C9A7";ctx.font="bold 13px 'Space Grotesk'";ctx.textAlign="center";ctx.fillText("DECODER",dx+dw/2,dy+24);
    ctx.fillStyle="#6b7394";ctx.font="10px 'Space Grotesk'";ctx.fillText("Masked Self-Attn + Cross-Attn",dx+dw/2,dy+44);
    ["Je","suis","ici"].forEach((tk,i)=>{const a=Math.min((t*.8-i*.4),1);if(a<=0)return;ctx.globalAlpha=a;ctx.fillStyle="rgba(0,201,167,.2)";ctx.strokeStyle="#00C9A760";ctx.lineWidth=1;rr(ctx,dx+18+i*54,dy+eh-50,46,26,5);ctx.fill();ctx.stroke();ctx.fillStyle="#00C9A7";ctx.font="11px 'JetBrains Mono'";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(tk,dx+18+i*54+23,dy+eh-37);ctx.textBaseline="alphabetic";ctx.globalAlpha=1;});
  },
  posenc:(ctx,w,h,t)=>{
    ctx.clearRect(0,0,w,h);
    const pos=20,dims=8,cw=(w-40)/pos,ch=(h-54)/dims;
    ctx.fillStyle="#6b7394";ctx.font="10px 'Space Grotesk'";ctx.textAlign="center";ctx.fillText("Sinusoidal PE Matrix — each column = one token's positional fingerprint",w/2,14);
    for(let p=0;p<pos;p++)for(let d=0;d<dims;d++){
      const i=Math.floor(d/2),val=d%2===0?Math.sin(p/Math.pow(10000,2*i/8)):Math.cos(p/Math.pow(10000,2*i/8));
      const a=Math.min((t*.4-p*.02),1);if(a<=0)continue;
      ctx.globalAlpha=Math.max(0,a);
      const rv=val>0?Math.floor(val*100+20):20,bv=val<0?Math.floor(-val*100+20):20;
      ctx.fillStyle=`rgb(${rv},36,${bv})`;ctx.fillRect(40+p*cw,20+d*ch,cw-1,ch-1);
    }
    ctx.globalAlpha=1;
    ctx.fillStyle="#6b7394";ctx.font="9px 'JetBrains Mono'";ctx.textAlign="center";ctx.fillText("Position →",w/2,h-8);
  },
  attn:(ctx,w,h,t)=>{
    ctx.clearRect(0,0,w,h);
    const toks=["The","cat","sat"],n=3,tw=54,th=28,g=10,sx=(w-n*(tw+g))/2,ty=18;
    toks.forEach((tok,i)=>{rr(ctx,sx+i*(tw+g),ty,tw,th,5);ctx.fillStyle="rgba(108,99,255,.1)";ctx.fill();ctx.strokeStyle="#6C63FF30";ctx.lineWidth=1;ctx.stroke();ctx.fillStyle="#c8d0e8";ctx.font="12px 'JetBrains Mono'";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(tok,sx+i*(tw+g)+tw/2,ty+th/2);ctx.textBaseline="alphabetic";});
    const ms=34,mx=(w-n*ms)/2,my=62;
    ctx.fillStyle="#6b7394";ctx.font="9.5px 'Space Grotesk'";ctx.textAlign="center";ctx.fillText("softmax(QKᵀ/√d_k) — attention weight matrix",w/2,my-9);
    const W=[[.8,.1,.1],[.2,.7,.1],[.1,.3,.6]];
    for(let r=0;r<n;r++)for(let c=0;c<n;c++){
      const v=W[r][c]*Math.min(t*.8,1);
      ctx.fillStyle=`rgba(108,99,255,${v*.85})`;ctx.fillRect(mx+c*ms,my+r*ms,ms-1,ms-1);
      ctx.strokeStyle="rgba(108,99,255,.18)";ctx.lineWidth=1;ctx.strokeRect(mx+c*ms,my+r*ms,ms-1,ms-1);
      ctx.fillStyle="#e8eaf0";ctx.font="10px 'JetBrains Mono'";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(W[r][c].toFixed(1),mx+c*ms+ms/2,my+r*ms+ms/2);ctx.textBaseline="alphabetic";
    }
    toks.forEach((tok,i)=>{ctx.fillStyle="#6b7394";ctx.font="9.5px 'JetBrains Mono'";ctx.textAlign="right";ctx.fillText(tok,mx-5,my+i*ms+ms/2+3);ctx.textAlign="center";ctx.fillText(tok,mx+i*ms+ms/2,my+n*ms+13);});
    ctx.fillStyle="#6b7394";ctx.font="10px 'Space Grotesk'";ctx.textAlign="center";ctx.fillText("→  multiply by V to get contextual representations",w/2,my+n*ms+30);
  },
  mha:(ctx,w,h,t)=>{
    ctx.clearRect(0,0,w,h);
    const nh=4,hw=58,hh=78,g=14,sx=(w-nh*hw-(nh-1)*g)/2;
    const cs=["#6C63FF","#00C9A7","#F7B731","#FD79A8"],labs=["Syntax","Coref","Local","Semant"];
    for(let i=0;i<nh;i++){
      const x=sx+i*(hw+g),y=h*.14,a=Math.min((t*.5-i*.22),1);if(a<=0)continue;
      ctx.globalAlpha=a;ctx.fillStyle=cs[i]+"18";ctx.strokeStyle=cs[i]+"70";ctx.lineWidth=1.5;rr(ctx,x,y,hw,hh,8);ctx.fill();ctx.stroke();
      ctx.fillStyle=cs[i];ctx.font="bold 10px 'JetBrains Mono'";ctx.textAlign="center";ctx.fillText("H"+(i+1),x+hw/2,y+16);
      ctx.fillStyle="#9aa3bf";ctx.font="9px 'Space Grotesk'";ctx.fillText(labs[i],x+hw/2,y+30);
      for(let r=0;r<3;r++)for(let c=0;c<3;c++){ctx.fillStyle=cs[i]+Math.floor((.15+Math.sin(i+r+c)*.1+.25)*255).toString(16).padStart(2,"0");ctx.fillRect(x+5+c*14,y+38+r*12,12,10);}
      ctx.globalAlpha=1;
    }
    const ay=h*.14+hh+14;
    for(let i=0;i<nh;i++){const x=sx+i*(hw+g)+hw/2;ctx.strokeStyle="#A29BFE30";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,ay);ctx.lineTo(w/2,ay+24);ctx.stroke();}
    ctx.fillStyle="rgba(162,155,254,.12)";ctx.strokeStyle="#A29BFE";ctx.lineWidth=1.8;rr(ctx,sx,ay+28,nh*hw+(nh-1)*g,28,6);ctx.fill();ctx.stroke();
    ctx.fillStyle="#A29BFE";ctx.font="bold 11px 'Space Grotesk'";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("Concat(h1…h4) · W_O  →  d_model output",w/2,ay+42);ctx.textBaseline="alphabetic";
  },
  ffn:(ctx,w,h,t)=>{
    ctx.clearRect(0,0,w,h);
    const layers=[4,10,4],cs=["#6C63FF","#00C9A7","#A29BFE"],lw=55,lh=h-56,lg=(w-layers.length*lw-40)/(layers.length-1),sx=20,labs=["d_model","4·d_model","d_model"];
    layers.forEach((n,li)=>{
      const x=sx+li*(lw+lg),ng=lh/n;
      for(let ni=0;ni<n;ni++){
        const ny=28+ni*ng+ng/2,a=Math.min((t*.5-li*.3),1);if(a<=0)continue;
        ctx.globalAlpha=Math.max(0,a);
        ctx.fillStyle=cs[li]+"44";ctx.strokeStyle=cs[li];ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x+lw/2,ny,7,0,Math.PI*2);ctx.fill();ctx.stroke();
        if(li<layers.length-1){const nx2=sx+(li+1)*(lw+lg),n2=layers[li+1],ng2=lh/n2;for(let nni=0;nni<Math.min(n2,4);nni++){const nny=28+nni*ng2+ng2/2;ctx.strokeStyle=cs[li]+"15";ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(x+lw/2+7,ny);ctx.lineTo(nx2+lw/2-7,nny);ctx.stroke();}}
        ctx.globalAlpha=1;
      }
      ctx.fillStyle="#6b7394";ctx.font="9px 'JetBrains Mono'";ctx.textAlign="center";ctx.fillText(labs[li],x+lw/2,h-10);
    });
    ctx.fillStyle="#F7B731";ctx.font="bold 10px 'JetBrains Mono'";ctx.textAlign="center";ctx.fillText("Activation",sx+(lw+lg)+lw/2,h-22);
  },
  bert:(ctx,w,h,t)=>{
    ctx.clearRect(0,0,w,h);
    const toks=["The","[MASK]","sat","on","[MASK]","mat"],tw=60,th=32,g=8,sx=(w-toks.length*(tw+g))/2,y=22;
    toks.forEach((tok,i)=>{const isM=tok==="[MASK]";rr(ctx,sx+i*(tw+g),y,tw,th,5);ctx.fillStyle=isM?"rgba(253,121,168,.2)":"rgba(108,99,255,.1)";ctx.fill();ctx.strokeStyle=isM?"#FD79A8":"#6C63FF30";ctx.lineWidth=isM?2:1;ctx.stroke();ctx.fillStyle=isM?"#FD79A8":"#c8d0e8";ctx.font=isM?"bold 9.5px 'JetBrains Mono'":"12px 'JetBrains Mono'";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(tok,sx+i*(tw+g)+tw/2,y+th/2);ctx.textBaseline="alphabetic";});
    ctx.setLineDash([3,3]);ctx.strokeStyle="#6C63FF22";ctx.lineWidth=1;[1,4].forEach(mi=>{for(let i=0;i<toks.length;i++){if(i===mi)return;ctx.beginPath();ctx.moveTo(sx+i*(tw+g)+tw/2,y+th+5);ctx.lineTo(sx+mi*(tw+g)+tw/2,y+th+5);ctx.stroke();}});ctx.setLineDash([]);
    const pa=Math.min(t-.5,1);if(pa>0){ctx.globalAlpha=pa;[{idx:1,pred:"cat",p:.82},{idx:4,pred:"the",p:.91}].forEach(({idx,pred,p})=>{const bx=sx+idx*(tw+g),by=y+th+22;rr(ctx,bx,by,tw,32,5);ctx.fillStyle="rgba(0,201,167,.15)";ctx.fill();ctx.strokeStyle="#00C9A7";ctx.lineWidth=1.5;ctx.stroke();ctx.fillStyle="#00C9A7";ctx.font="bold 11px 'JetBrains Mono'";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText('"'+pred+'"',bx+tw/2,by+11);ctx.fillStyle="#F7B731";ctx.font="9.5px 'JetBrains Mono'";ctx.fillText(p,bx+tw/2,by+25);ctx.textBaseline="alphabetic";});ctx.globalAlpha=1;}
    ctx.fillStyle="#6b7394";ctx.font="10.5px 'Space Grotesk'";ctx.textAlign="center";ctx.fillText("← Both left AND right context visible — bidirectional →",w/2,h-10);
  },
  gpt:(ctx,w,h,t)=>{
    ctx.clearRect(0,0,w,h);
    const gen=["Once","upon","a","time","there"],vis=Math.min(Math.floor(t*.55)+1,gen.length),tw=58,th=32,g=8,sx=(w-gen.length*(tw+g))/2,y=26;
    for(let i=0;i<gen.length;i++){const x=sx+i*(tw+g),isNew=i===vis-1,hidden=i>=vis;rr(ctx,x,y,tw,th,5);ctx.fillStyle=isNew?"rgba(0,201,167,.2)":hidden?"rgba(22,26,36,.8)":"rgba(108,99,255,.1)";ctx.fill();ctx.strokeStyle=isNew?"#00C9A7":hidden?"#1f2535":"#6C63FF30";ctx.lineWidth=isNew?2:1;ctx.stroke();ctx.fillStyle=isNew?"#00C9A7":hidden?"#2a3050":"#c8d0e8";ctx.font="12px 'JetBrains Mono'";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(hidden?"?":gen[i],x+tw/2,y+th/2);ctx.textBaseline="alphabetic";}
    if(vis>1){const lx=sx+(vis-1)*(tw+g)+tw/2;for(let i=0;i<vis-1;i++){ctx.strokeStyle="rgba(108,99,255,.22)";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(sx+i*(tw+g)+tw/2,y-2);ctx.lineTo(lx,y-10);ctx.stroke();}}
    ctx.fillStyle="#6b7394";ctx.font="10.5px 'Space Grotesk'";ctx.textAlign="center";ctx.fillText("Causal mask: each token only attends left — no peeking right →",w/2,y+th+24);
    ctx.fillStyle="#00C9A7";ctx.font="bold 10.5px 'Space Grotesk'";ctx.fillText("Token generated one-at-a-time; appended as new context",w/2,y+th+42);
  },
  causal_mask:(ctx,w,h,t)=>{
    ctx.clearRect(0,0,w,h);
    const n=5,cs=24,sx=(w-n*cs)/2,sy=(h-n*cs)/2-10;
    ctx.fillStyle="#6b7394";ctx.font="11px 'Space Grotesk'";ctx.textAlign="center";ctx.fillText("Causal Mask (Upper Triangular = -∞)",w/2,sy-16);
    for(let r=0;r<n;r++)for(let c=0;c<n;c++){
      const isMasked=c>r;
      const ts=Math.min(t*.8,1);
      ctx.globalAlpha=ts;
      ctx.fillStyle=isMasked?"rgba(255,107,107,.15)":"rgba(0,201,167,.15)";
      ctx.fillRect(sx+c*cs,sy+r*cs,cs-1,cs-1);
      ctx.strokeStyle=isMasked?"#FF6B6B40":"#00C9A740";
      ctx.lineWidth=1;
      ctx.strokeRect(sx+c*cs,sy+r*cs,cs-1,cs-1);
      ctx.fillStyle=isMasked?"#FF6B6B":"#00C9A7";
      ctx.font="10px 'JetBrains Mono'";ctx.textAlign="center";ctx.textBaseline="middle";
      ctx.fillText(isMasked?"-∞":"0",sx+c*cs+cs/2,sy+r*cs+cs/2);
      ctx.textBaseline="alphabetic";
    }
    ctx.globalAlpha=1;
    ctx.fillStyle="#6b7394";ctx.font="10px 'Space Grotesk'";ctx.textAlign="center";ctx.fillText("Prevents attending to future tokens during training",w/2,sy+n*cs+22);
  },
  t5:(ctx,w,h,t)=>{
    ctx.clearRect(0,0,w,h);
    const ew=w*.37,eh=h*.54,ex=w*.02,ey=(h-eh)/2,dw=w*.37,dx=w*.59,dy=(h-eh)/2;
    ctx.fillStyle="rgba(108,99,255,.1)";ctx.strokeStyle="#6C63FF";ctx.lineWidth=2;rr(ctx,ex,ey,ew,eh,12);ctx.fill();ctx.stroke();
    ctx.fillStyle="#6C63FF";ctx.font="bold 13px 'Space Grotesk'";ctx.textAlign="center";ctx.fillText("ENCODER",ex+ew/2,ey+22);
    ["translate to German:","Hello world"].forEach((s,i)=>{const by=ey+40+i*30;rr(ctx,ex+8,by,ew-16,24,4);ctx.fillStyle=i===0?"rgba(247,183,49,.15)":"rgba(108,99,255,.18)";ctx.fill();ctx.strokeStyle=i===0?"#F7B73140":"#6C63FF40";ctx.lineWidth=1;ctx.stroke();ctx.fillStyle="#c8d0e8";ctx.font="10px 'JetBrains Mono'";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(s,ex+ew/2,by+12);ctx.textBaseline="alphabetic";});
    const anim=Math.sin(t*1.5)*.5+.5;ctx.strokeStyle=`rgba(0,201,167,${.5+anim*.5})`;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(ex+ew,h/2);ctx.lineTo(dx,h/2);ctx.stroke();
    ctx.fillStyle="#00C9A7";ctx.font="9.5px 'Space Grotesk'";ctx.textAlign="center";ctx.fillText("cross-attn",ex+ew+(dx-ex-ew)/2,h/2-9);
    ctx.fillStyle="rgba(0,201,167,.1)";ctx.strokeStyle="#00C9A7";ctx.lineWidth=2;rr(ctx,dx,dy,dw,eh,12);ctx.fill();ctx.stroke();
    ctx.fillStyle="#00C9A7";ctx.font="bold 13px 'Space Grotesk'";ctx.textAlign="center";ctx.fillText("DECODER",dx+dw/2,dy+22);
    ["Hallo","Welt"].forEach((tk,i)=>{const a=Math.min((t*.8-i*.5),1);if(a<=0)return;ctx.globalAlpha=a;rr(ctx,dx+12+i*70,dy+eh-50,62,26,5);ctx.fillStyle="rgba(0,201,167,.2)";ctx.fill();ctx.strokeStyle="#00C9A760";ctx.lineWidth=1;ctx.stroke();ctx.fillStyle="#00C9A7";ctx.font="11px 'JetBrains Mono'";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(tk,dx+12+i*70+31,dy+eh-37);ctx.textBaseline="alphabetic";ctx.globalAlpha=1;});
  },
  moe:(ctx,w,h,t)=>{
    ctx.clearRect(0,0,w,h);
    const ne=6,ew=46,eh=56,eg=12,sx=(w-ne*(ew+eg))/2,ey=h-84,tx=w/2,ty=22;
    rr(ctx,tx-28,ty,56,26,6);ctx.fillStyle="rgba(108,99,255,.2)";ctx.fill();ctx.strokeStyle="#6C63FF";ctx.lineWidth=2;ctx.stroke();ctx.fillStyle="#fff";ctx.font="bold 11px 'JetBrains Mono'";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("token",tx,ty+13);ctx.textBaseline="alphabetic";
    const ry=68;rr(ctx,tx-44,ry,88,24,6);ctx.fillStyle="rgba(247,183,49,.14)";ctx.fill();ctx.strokeStyle="#F7B731";ctx.lineWidth=1.5;ctx.stroke();ctx.fillStyle="#F7B731";ctx.font="bold 10px 'JetBrains Mono'";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("Router (top-k)",tx,ry+12);ctx.textBaseline="alphabetic";
    ctx.strokeStyle="#6C63FF40";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(tx,ty+26);ctx.lineTo(tx,ry);ctx.stroke();
    const active=[1,4],co=Math.floor(t*.35)%2,an=[active[co%2],active[(co+1)%2]];
    for(let e=0;e<ne;e++){const ex=sx+e*(ew+eg),isA=an.includes(e);ctx.fillStyle=isA?"rgba(0,201,167,.2)":"rgba(24,28,36,.5)";ctx.strokeStyle=isA?"#00C9A7":"#2a3050";ctx.lineWidth=isA?2:1;rr(ctx,ex,ey,ew,eh,8);ctx.fill();ctx.stroke();ctx.fillStyle=isA?"#00C9A7":"#3a4060";ctx.font=(isA?"bold ":"")+"10.5px 'JetBrains Mono'";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("E"+(e+1),ex+ew/2,ey+eh/2);ctx.textBaseline="alphabetic";ctx.strokeStyle=isA?"rgba(0,201,167,.65)":"rgba(42,48,80,.35)";ctx.lineWidth=isA?2:1;ctx.beginPath();ctx.moveTo(tx,ry+24);ctx.lineTo(ex+ew/2,ey);ctx.stroke();}
    ctx.fillStyle="#6b7394";ctx.font="10px 'Space Grotesk'";ctx.textAlign="center";ctx.fillText("Only top-k experts activated per token — rest contribute zero",w/2,h-10);
  },
  ssm:(ctx,w,h,t)=>{
    ctx.clearRect(0,0,w,h);
    const sw=118,sh=48,sx=(w-sw)/2,sy=26;
    ctx.fillStyle="rgba(162,155,254,.14)";ctx.strokeStyle="#A29BFE";ctx.lineWidth=2;rr(ctx,sx,sy,sw,sh,8);ctx.fill();ctx.stroke();
    ctx.fillStyle="#A29BFE";ctx.font="bold 11.5px 'JetBrains Mono'";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("State x_k",sx+sw/2,sy+sh/2);ctx.textBaseline="alphabetic";
    const n=5,tw=38,th=24,iy=h-54,tg=8,isx=(w-n*(tw+tg))/2;
    for(let i=0;i<n;i++){const ix=isx+i*(tw+tg),act=i<=Math.floor(t*.55)%n;rr(ctx,ix,iy,tw,th,5);ctx.fillStyle=act?"rgba(108,99,255,.28)":"rgba(108,99,255,.06)";ctx.fill();ctx.strokeStyle=act?"#6C63FF":"#2a305060";ctx.lineWidth=1.5;ctx.stroke();ctx.fillStyle=act?"#c8d0e8":"#2a3050";ctx.font="10px 'JetBrains Mono'";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("u"+i,ix+tw/2,iy+th/2);ctx.textBaseline="alphabetic";if(act){ctx.strokeStyle="#6C63FF55";ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(ix+tw/2,iy);ctx.lineTo(sx+sw/2,sy+sh);ctx.stroke();}}
    const my=sy+sh+52;rr(ctx,sx-38,my,sw+76,38,8);ctx.fillStyle="rgba(0,201,167,.1)";ctx.fill();ctx.strokeStyle="#00C9A760";ctx.lineWidth=1.5;ctx.stroke();
    ctx.fillStyle="#00C9A7";ctx.font="bold 10.5px 'JetBrains Mono'";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("Mamba: B, C, Δ = f(input) — selective",sx+sw/2,my+13);ctx.fillStyle="#6b7394";ctx.font="9.5px 'Space Grotesk'";ctx.fillText("O(1) memory/step at inference — O(n) total",sx+sw/2,my+28);ctx.textBaseline="alphabetic";
  },
  linAttn:(ctx,w,h,t)=>{
    ctx.clearRect(0,0,w,h);
    const n=6,d=4,half=w/2-4;
    ctx.fillStyle="#6b7394";ctx.font="bold 10.5px 'Space Grotesk'";ctx.textAlign="center";ctx.fillText("Exact O(n²)",w*.25,18);ctx.fillText("Linear O(n)",w*.75,18);
    ctx.strokeStyle="#2a3050";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(half,14);ctx.lineTo(half,h-14);ctx.stroke();
    const cs=Math.min((half-30)/n,28);
    for(let i=0;i<n;i++)for(let j=0;j<n;j++){ctx.globalAlpha=Math.min(t*.5,1);ctx.fillStyle=`rgba(108,99,255,${.25+j/n*.45})`;ctx.fillRect(28+j*cs,26+i*cs,cs-1,cs-1);}
    ctx.globalAlpha=1;ctx.fillStyle="#E17055";ctx.font="bold 12px 'JetBrains Mono'";ctx.textAlign="center";ctx.fillText(n+"x"+n+"="+n*n+" ops",w*.25,26+n*cs+18);
    const ms=Math.min((half-30)/d,28),ox=half+28;
    for(let i=0;i<d;i++)for(let j=0;j<d;j++){const a=Math.min((t-.6)*.6,1);ctx.globalAlpha=Math.max(0,a);ctx.fillStyle=`rgba(0,201,167,${.3+j/d*.5})`;ctx.fillRect(ox+j*ms,26+i*ms,ms-1,ms-1);}
    ctx.globalAlpha=1;ctx.fillStyle="#00C9A7";ctx.font="bold 11px 'JetBrains Mono'";ctx.textAlign="center";ctx.fillText("φ(K)ᵀV: "+d+"x"+d+"="+d*d,w*.75,26+d*ms+18);ctx.fillText("then n×"+d*d+"="+n*d*d+" ops",w*.75,26+d*ms+34);
  },
  rwkv:(ctx,w,h,t)=>{
    ctx.clearRect(0,0,w,h);
    const n=6,r=18,g=52,sx=22,y=h*.35;
    for(let i=0;i<n;i++){const x=sx+i*(r*2+g),decay=Math.exp(-(n-1-i)*.6);ctx.globalAlpha=decay*.9+.1;ctx.fillStyle=`rgba(162,155,254,${decay*.4})`;ctx.strokeStyle=`rgba(162,155,254,${decay*.8})`;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle="#A29BFE";ctx.font="bold 9px 'JetBrains Mono'";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("v"+i,x,y);ctx.textBaseline="alphabetic";if(i===n-1){ctx.fillStyle="#6b7394";ctx.font="8.5px 'Space Grotesk'";ctx.textAlign="center";ctx.fillText("current",x,y+r+13);}ctx.globalAlpha=1;}
    const outX=w-52,outY=y;ctx.strokeStyle="#F7B731";ctx.lineWidth=1.5;
    for(let i=0;i<n;i++){const x=sx+i*(r*2+g);ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(outX,outY);ctx.stroke();}
    ctx.fillStyle="rgba(247,183,49,.18)";ctx.strokeStyle="#F7B731";ctx.lineWidth=2;ctx.beginPath();ctx.arc(outX,outY,20,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.fillStyle="#F7B731";ctx.font="bold 9px 'JetBrains Mono'";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("wkv_t",outX,outY);ctx.textBaseline="alphabetic";
    ctx.fillStyle="#6b7394";ctx.font="10px 'Space Grotesk'";ctx.textAlign="center";ctx.fillText("Exponential time-decay w learned per channel; runs as RNN at inference",w/2,h-10);
  },
  retnet:(ctx,w,h,t)=>{
    ctx.clearRect(0,0,w,h);
    const n=5,r=18,g=54,sx=28,y=h*.35,gamma=.82;
    for(let i=0;i<n;i++){const x=sx+i*(r*2+g),act=i<=Math.floor(t*.5)%n;ctx.fillStyle=act?"rgba(0,201,167,.22)":"rgba(0,201,167,.05)";ctx.strokeStyle=act?"#00C9A7":"#1a2828";ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle=act?"#00C9A7":"#1a2828";ctx.font="bold 9px 'JetBrains Mono'";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("p"+i,x,y);ctx.textBaseline="alphabetic";}
    for(let i=0;i<n-1;i++){const x1=sx+i*(r*2+g)+r,x2=sx+(i+1)*(r*2+g)-r,dec=Math.pow(gamma,n-2-i);ctx.strokeStyle=`rgba(0,201,167,${dec*.8})`;ctx.lineWidth=1+dec;ctx.beginPath();ctx.moveTo(x1,y);ctx.lineTo(x2,y);ctx.stroke();ctx.fillStyle="#6b7394";ctx.font="8px 'JetBrains Mono'";ctx.textAlign="center";ctx.fillText("γ^"+(n-2-i),x1+(x2-x1)/2,y-r-4);}
    const my=y+r+36;ctx.fillStyle="rgba(162,155,254,.1)";ctx.strokeStyle="#A29BFE60";ctx.lineWidth=1.5;rr(ctx,28,my,w-56,40,8);ctx.fill();ctx.stroke();
    ctx.fillStyle="#A29BFE";ctx.font="bold 10.5px 'JetBrains Mono'";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("γ="+gamma+" retention rate — 3 equivalent forms",w/2,my+13);ctx.fillStyle="#6b7394";ctx.font="9.5px 'Space Grotesk'";ctx.fillText("Parallel (train)  ·  Recurrent (inference)  ·  Chunk-wise",w/2,my+28);ctx.textBaseline="alphabetic";
  },
  toktradeoff:(ctx,w,h,t)=>{
    ctx.clearRect(0,0,w,h);
    const apps=[{n:"Characters",toks:["u","n","h","a","p","p","y"],c:"#E17055",v:"26 vocab"},{n:"BPE",toks:["un","happy"],c:"#00C9A7",v:"50K vocab"},{n:"WordPiece",toks:["un","##happy"],c:"#F7B731",v:"30K vocab"},{n:"Full Word",toks:["unhappy"],c:"#6C63FF",v:"∞ vocab"}];
    const pw=(w-40)/apps.length;
    apps.forEach((ap,i)=>{
      const px=20+i*pw,a=Math.min((t*.5-i*.18),1);if(a<=0)return;
      ctx.globalAlpha=a;ctx.fillStyle="#6b7394";ctx.font="bold 10px 'Space Grotesk'";ctx.textAlign="center";ctx.fillText(ap.n,px+pw/2-10,22);
      ctx.fillStyle="#3a4060";ctx.font="9px 'JetBrains Mono'";ctx.fillText(ap.v,px+pw/2-10,36);
      let cx_=px+4,cy=46;
      ap.toks.forEach(tok=>{const cw_=tok.length*7+10;if(cx_+cw_>px+pw-4){cx_=px+4;cy+=26;}rr(ctx,cx_,cy,cw_,20,4);ctx.fillStyle=ap.c+"22";ctx.fill();ctx.strokeStyle=ap.c+"88";ctx.lineWidth=1;ctx.stroke();ctx.fillStyle=ap.c;ctx.font="9.5px 'JetBrains Mono'";ctx.textAlign="left";ctx.textBaseline="middle";ctx.fillText(tok,cx_+4,cy+10);ctx.textBaseline="alphabetic";cx_+=cw_+4;});
      ctx.fillStyle="#6b7394";ctx.font="9px 'Space Grotesk'";ctx.textAlign="center";ctx.fillText(ap.toks.length+" token(s)",px+pw/2-10,cy+34);
      ctx.globalAlpha=1;
    });
  },
  bpe:(ctx,w,h,t)=>{
    ctx.clearRect(0,0,w,h);
    const steps=[{toks:["l","o","w","e","r"," ","l","o","w"," ","n","e","w","e","r"],hl:[]},{toks:["l","o","w","er"," ","l","o","w"," ","n","e","w","er"],hl:[3,12]},{toks:["l","ow","er"," ","l","ow"," ","n","e","w","er"],hl:[1,5]},{toks:["low","er"," ","low"," ","n","e","w","er"],hl:[0,3]}];
    const si=Math.min(Math.floor(t*.45),steps.length-1),s=steps[si],tw_=30,th=26,g=5,sx=(w-s.toks.length*(tw_+g))/2,y=26;
    ctx.fillStyle="#6b7394";ctx.font="10px 'Space Grotesk'";ctx.textAlign="center";ctx.fillText("BPE Step "+si+": "+["Initial chars","Merge 'er'","Merge 'ow'","Merge 'low'"][si],w/2,14);
    s.toks.forEach((tok,i)=>{const isH=s.hl.includes(i);rr(ctx,sx+i*(tw_+g),y,tw_,th,4);ctx.fillStyle=isH?"rgba(0,201,167,.25)":"rgba(108,99,255,.1)";ctx.fill();ctx.strokeStyle=isH?"#00C9A7":"#6C63FF30";ctx.lineWidth=isH?2:1;ctx.stroke();ctx.fillStyle=isH?"#00C9A7":"#c8d0e8";ctx.font="11px 'JetBrains Mono'";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(tok===" "?"_":tok,sx+i*(tw_+g)+tw_/2,y+th/2);ctx.textBaseline="alphabetic";});
    const by=y+th+22;[["er",3],["ow",2],["lo",1]].forEach(([p,f],i)=>{ctx.fillStyle="rgba(0,201,167,.15)";ctx.fillRect(20,by+i*24,f*44,16);ctx.fillStyle="#00C9A7";ctx.fillRect(20,by+i*24,f*44*(si>0?.95:.5),16);ctx.fillStyle="#e8eaf0";ctx.font="10px 'JetBrains Mono'";ctx.textAlign="left";ctx.textBaseline="middle";ctx.fillText('"'+p+'": count='+f,24+f*44+8,by+i*24+8);ctx.textBaseline="alphabetic";});
  },
  wordpiece:(ctx,w,h,t)=>{
    ctx.clearRect(0,0,w,h);
    ctx.fillStyle="#6b7394";ctx.font="10px 'Space Grotesk'";ctx.textAlign="center";ctx.fillText("WordPiece: merge by likelihood gain — '##' marks continuation subwords",w/2,14);
    const rows=[{w:"unbelievable",bpe:["un","believ","able"],wp:["un","##believ","##able"]},{w:"running",bpe:["run","ning"],wp:["run","##ning"]},{w:"tokenization",bpe:["token","ization"],wp:["token","##ization"]}];
    rows.forEach((row,ri)=>{
      const ry=30+ri*58;ctx.fillStyle="#e8eaf0";ctx.font="bold 11.5px 'JetBrains Mono'";ctx.textAlign="left";ctx.fillText('"'+row.w+'"',14,ry+14);
      let bx=14;ctx.fillStyle="#6b7394";ctx.font="9px 'Space Grotesk'";ctx.fillText("BPE:",bx,ry+30);bx+=36;
      row.bpe.forEach(tok=>{const cw_=tok.length*7+10;rr(ctx,bx,ry+20,cw_,18,3);ctx.fillStyle="rgba(108,99,255,.15)";ctx.fill();ctx.strokeStyle="#6C63FF40";ctx.lineWidth=1;ctx.stroke();ctx.fillStyle="#9aa3bf";ctx.font="10px 'JetBrains Mono'";ctx.textAlign="left";ctx.textBaseline="middle";ctx.fillText(tok,bx+4,ry+29);ctx.textBaseline="alphabetic";bx+=cw_+4;});
      bx+=14;ctx.fillStyle="#6b7394";ctx.font="9px 'Space Grotesk'";ctx.fillText("WP:",bx,ry+30);bx+=30;
      row.wp.forEach(tok=>{const cw_=tok.length*7+10;rr(ctx,bx,ry+20,cw_,18,3);ctx.fillStyle="rgba(0,201,167,.15)";ctx.fill();ctx.strokeStyle="#00C9A740";ctx.lineWidth=1;ctx.stroke();ctx.fillStyle="#00C9A7";ctx.font="10px 'JetBrains Mono'";ctx.textAlign="left";ctx.textBaseline="middle";ctx.fillText(tok,bx+4,ry+29);ctx.textBaseline="alphabetic";bx+=cw_+4;});
    });
  },
  sp:(ctx,w,h,t)=>{
    ctx.clearRect(0,0,w,h);
    const text="Hello world! 你好世界",sp=["▁Hello","▁world","!","▁你","好","世","界"];
    ctx.fillStyle="#6b7394";ctx.font="10px 'Space Grotesk'";ctx.textAlign="left";ctx.fillText('Input: "'+text+'"',14,18);
    const drawRow=(toks,lbl,y,c)=>{ctx.fillStyle="#6b7394";ctx.font="bold 9.5px 'Space Grotesk'";ctx.textAlign="left";ctx.fillText(lbl,14,y);let cx_=14,ry=y+8;toks.forEach(tok=>{const cw_=Math.max(tok.length*7,14)+10;if(cx_+cw_>w-14){cx_=14;ry+=24;}rr(ctx,cx_,ry,cw_,18,3);ctx.fillStyle=c+"20";ctx.fill();ctx.strokeStyle=c+"66";ctx.lineWidth=1;ctx.stroke();ctx.fillStyle=c;ctx.font="9.5px 'JetBrains Mono'";ctx.textAlign="left";ctx.textBaseline="middle";ctx.fillText(tok.slice(0,10),cx_+4,ry+9);ctx.textBaseline="alphabetic";cx_+=cw_+4;});return ry+26;};
    const a=Math.min(t*.5,1);ctx.globalAlpha=a;
    let y=drawRow(sp,"SentencePiece (▁=word boundary, language-agnostic):",28,"#00C9A7");
    const byteArr=[...(new TextEncoder().encode(text))].map(b=>b.toString());
    drawRow(byteArr.slice(0,18),"Byte-level (UTF-8, vocab=256, zero unknowns):",y+6,"#A29BFE");
    ctx.globalAlpha=1;ctx.fillStyle="#6b7394";ctx.font="10px 'Space Grotesk'";ctx.textAlign="center";ctx.fillText("Byte-level: 3-4x longer sequences but universal coverage",w/2,h-10);
  },
  acts:(ctx,w,h,t)=>{
    ctx.clearRect(0,0,w,h);
    const fns=[{n:"ReLU",fn:x=>Math.max(0,x),c:"#FF6B6B"},{n:"GELU",fn:x=>x*.5*(1+Math.tanh(Math.sqrt(2/Math.PI)*(x+.044715*x*x*x))),c:"#00C9A7"},{n:"SwiGLU",fn:x=>x*(1/(1+Math.exp(-x)))*(Math.max(0,x)*.7+.5),c:"#A29BFE"}];
    const pw=(w-56)/3,ph=h-52,py=28,g=16;
    fns.forEach((fn,fi)=>{
      const px=16+fi*(pw+g);ctx.fillStyle="#6b7394";ctx.font="bold 10.5px 'Space Grotesk'";ctx.textAlign="center";ctx.fillText(fn.n,px+pw/2,py-9);
      ctx.strokeStyle="#2a3050";ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px,py+ph);ctx.stroke();ctx.beginPath();ctx.moveTo(px,py+ph/2);ctx.lineTo(px+pw,py+ph/2);ctx.stroke();
      const sy=ph/4,a=Math.min(t*.65,1);ctx.strokeStyle=fn.c;ctx.lineWidth=2.5;ctx.globalAlpha=a;ctx.beginPath();
      for(let i=0;i<=80;i++){const x=-3+6*i/80,y=fn.fn(x),cx_=px+i*pw/80,cy_=py+ph/2-y*sy;i===0?ctx.moveTo(cx_,cy_):ctx.lineTo(cx_,cy_);}
      ctx.stroke();ctx.globalAlpha=1;
      if(fi===0){ctx.fillStyle="#FF6B6B18";ctx.fillRect(px,py,pw/2,ph);ctx.fillStyle="#FF6B6B";ctx.font="8.5px 'Space Grotesk'";ctx.textAlign="center";ctx.fillText("dead zone",px+pw/4,py+ph-8);}
    });
  },
  norm:(ctx,w,h,t)=>{
    ctx.clearRect(0,0,w,h);
    const drawDist=(cx,cy,mu,sigma,c,lbl)=>{ctx.strokeStyle=c;ctx.lineWidth=2;ctx.beginPath();const range=sigma*5;for(let i=0;i<=80;i++){const x=mu-range/2+range*i/80,y=Math.exp(-.5*((x-mu)/sigma)**2)/(sigma*Math.sqrt(2*Math.PI));const px=cx+(x-mu)*18,py_=cy-y*56;i===0?ctx.moveTo(px,py_):ctx.lineTo(px,py_);}ctx.stroke();ctx.fillStyle="#6b7394";ctx.font="9.5px 'Space Grotesk'";ctx.textAlign="center";ctx.fillText(lbl,cx,cy+16);};
    const a=Math.min(t*.7,1);ctx.globalAlpha=a;
    drawDist(w*.24,h*.52,0,2.2,"#FF6B6B80","Unstable: σ=2.2");
    drawDist(w*.76,h*.52,0,.5,"#00C9A7","Stable: σ=0.5");
    ctx.globalAlpha=1;ctx.strokeStyle="#A29BFE";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(w*.36,h*.5);ctx.lineTo(w*.62,h*.5);ctx.stroke();ctx.fillStyle="#A29BFE";ctx.beginPath();ctx.moveTo(w*.62,h*.5-5);ctx.lineTo(w*.62,h*.5+5);ctx.lineTo(w*.62+8,h*.5);ctx.fill();
    ctx.fillStyle="#A29BFE";ctx.font="bold 10px 'Space Grotesk'";ctx.textAlign="center";ctx.fillText("Norm (LayerNorm / RMSNorm)",w/2,h*.5-12);
    ctx.fillStyle="#6b7394";ctx.font="9.5px 'Space Grotesk'";ctx.textAlign="center";ctx.fillText("RMSNorm skips mean-centering — faster, same quality",w/2,h-10);
  },
  rope:(ctx,w,h,t)=>{
    ctx.clearRect(0,0,w,h);
    const cx=w/2,cy=h/2,r=Math.min(w,h)*.28;
    ctx.strokeStyle="#1f2535";ctx.lineWidth=1;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.stroke();
    const pos=[0,4,8,14],cs=["#6C63FF","#00C9A7","#F7B731","#FD79A8"],theta=.25;
    pos.forEach((m,i)=>{const ang=m*theta+t*.18,vx=Math.cos(ang)*r,vy=-Math.sin(ang)*r;ctx.strokeStyle=cs[i];ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+vx,cy+vy);ctx.stroke();ctx.fillStyle=cs[i];ctx.beginPath();ctx.arc(cx+vx,cy+vy,5,0,Math.PI*2);ctx.fill();ctx.font="bold 9.5px 'JetBrains Mono'";ctx.textAlign="center";ctx.fillText("m="+m,cx+vx*1.2,cy+vy*1.2+4);});
    ctx.fillStyle="#444";ctx.beginPath();ctx.arc(cx,cy,3,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#6b7394";ctx.font="10px 'Space Grotesk'";ctx.textAlign="center";ctx.fillText("Rotate Q/K by m·θ — dot product depends only on (m−n)",cx,h-28);ctx.fillText("Relative position from absolute rotations — parameter-free",cx,h-12);
  },
  o2:(ctx,w,h,t)=>{
    ctx.clearRect(0,0,w,h);
    const lens=[1,2,4,8,16,32],maxN=32,bw=36,g=9,sx=(w-lens.length*(bw+g))/2,maxH=h-72;
    ctx.fillStyle="#6b7394";ctx.font="10px 'Space Grotesk'";ctx.textAlign="center";ctx.fillText("Memory vs. Sequence Length — Attention Bottleneck",w/2,16);
    lens.forEach((n,i)=>{const x=sx+i*(bw+g),lh=(n/maxN)*maxH*.42*Math.min(t,1),qh=(n*n/(maxN*maxN))*maxH*Math.min(t,1);ctx.fillStyle="rgba(0,201,167,.68)";ctx.fillRect(x,h-46-lh,bw/2-1,lh);ctx.fillStyle="rgba(225,112,85,.68)";ctx.fillRect(x+bw/2+1,h-46-qh,bw/2-1,qh);ctx.fillStyle="#6b7394";ctx.font="9px 'JetBrains Mono'";ctx.textAlign="center";ctx.fillText(n+"K",x+bw/2,h-28);});
    ctx.fillStyle="#00C9A7";ctx.fillRect(sx,h-16,14,9);ctx.fillStyle="#e8eaf0";ctx.font="9.5px 'Space Grotesk'";ctx.textAlign="left";ctx.fillText("KV-cache O(n)",sx+18,h-9);
    ctx.fillStyle="#E17055";ctx.fillRect(sx+132,h-16,14,9);ctx.fillText("Attn matrix O(n²)",sx+150,h-9);
  },
  ruler:(ctx,w,h,t)=>{
    ctx.clearRect(0,0,w,h);
    const models=[{n:"GPT-4",s:[99,97,91,84],c:"#00C9A7"},{n:"Llama3-70B",s:[98,93,84,68],c:"#6C63FF"},{n:"Mistral-L",s:[97,87,74,55],c:"#F7B731"},{n:"Model-X",s:[95,72,48,22],c:"#E17055"}];
    const lens=["4K","32K","64K","128K"],cw=(w-80)/lens.length,ch=h-72,sx=55,sy=18;
    [0,25,50,75,100].forEach(p=>{const y=sy+ch*(1-p/100);ctx.strokeStyle="rgba(255,255,255,.04)";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(sx,y);ctx.lineTo(sx+cw*lens.length,y);ctx.stroke();ctx.fillStyle="#2a3050";ctx.font="9px 'JetBrains Mono'";ctx.textAlign="right";ctx.fillText(p+"%",sx-4,y+3);});
    models.forEach(m=>{ctx.strokeStyle=m.c;ctx.lineWidth=2;ctx.beginPath();m.s.forEach((s,i)=>{const x=sx+i*cw+cw/2,y=sy+ch*(1-s/100)*Math.min(t*.65,1);i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);});ctx.stroke();m.s.forEach((s,i)=>{const x=sx+i*cw+cw/2,y=sy+ch*(1-s/100)*Math.min(t*.65,1);ctx.fillStyle=m.c;ctx.beginPath();ctx.arc(x,y,3.5,0,Math.PI*2);ctx.fill();});});
    lens.forEach((l,i)=>{ctx.fillStyle="#6b7394";ctx.font="9.5px 'JetBrains Mono'";ctx.textAlign="center";ctx.fillText(l,sx+i*cw+cw/2,sy+ch+16);});
    models.forEach((m,i)=>{ctx.fillStyle=m.c;ctx.fillRect(sx+i*70,sy+ch+28,12,8);ctx.fillStyle="#9aa3bf";ctx.font="9px 'Space Grotesk'";ctx.textAlign="left";ctx.fillText(m.n,sx+i*70+16,sy+ch+36);});
  },
  ssa:(ctx,w,h,t)=>{
    ctx.clearRect(0,0,w,h);
    const lens=[4,8,32,64,128,256,512,1000],maxV=1000*1000*.022,cw=w-54,ch=h-62,sx=36,sy=16;
    ctx.fillStyle="#6b7394";ctx.font="10px 'Space Grotesk'";ctx.textAlign="center";ctx.fillText("Prefill Time: FA-2 vs SSA — vendor-reported at scale",w/2,sy-6);
    const a=Math.min(t*.6,1);ctx.globalAlpha=a;
    ctx.strokeStyle="#E17055";ctx.lineWidth=2.5;ctx.beginPath();lens.forEach((n,i)=>{const x=sx+i*cw/(lens.length-1),y=sy+ch*(1-Math.min(n*n*.022/maxV,1));i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);});ctx.stroke();
    ctx.strokeStyle="#00C9A7";ctx.lineWidth=2.5;ctx.beginPath();lens.forEach((n,i)=>{const x=sx+i*cw/(lens.length-1),y=sy+ch*(1-Math.min(n*Math.log2(n+1)*.022/maxV,1));i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);});ctx.stroke();ctx.globalAlpha=1;
    ctx.fillStyle="#E17055";ctx.font="bold 9.5px 'Space Grotesk'";ctx.textAlign="left";ctx.fillText("FA2 O(n²)",sx+cw-100,sy+24);ctx.fillStyle="#00C9A7";ctx.fillText("SSA ~O(n log n)",sx+cw-100,sy+40);
    lens.forEach((n,i)=>{ctx.fillStyle="#2a3050";ctx.font="8.5px 'JetBrains Mono'";ctx.textAlign="center";ctx.fillText(n+"K",sx+i*cw/(lens.length-1),sy+ch+14);});
    rr(ctx,sx+cw-186,sy+ch-46,182,40,7);ctx.fillStyle="rgba(0,201,167,.1)";ctx.fill();ctx.strokeStyle="#00C9A740";ctx.lineWidth=1;ctx.stroke();
    ctx.fillStyle="#00C9A7";ctx.font="bold 11px 'JetBrains Mono'";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("56.2× speedup @ 1M tokens",sx+cw-95,sy+ch-28);ctx.textBaseline="alphabetic";
    ctx.fillStyle="#E17055";ctx.font="9px 'Space Grotesk'";ctx.textAlign="center";ctx.fillText("⚠ Vendor-reported figures — pending independent reproduction",w/2,h-8);
  },
  datawall:(ctx,w,h,t)=>{
    ctx.clearRect(0,0,w,h);
    const yrs=[2020,2022,2024,2026,2028,2030],cw=w-56,ch=h-66,sx=36,sy=18;
    const wX=sx+((2028-2020)/10)*cw;
    ctx.strokeStyle="#E17055";ctx.lineWidth=1.8;ctx.setLineDash([6,3]);ctx.beginPath();ctx.moveTo(wX,sy);ctx.lineTo(wX,sy+ch);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle="#E17055";ctx.font="bold 9.5px 'Space Grotesk'";ctx.textAlign="center";ctx.fillText("Data Wall ~2028",wX,sy-6);
    const a=Math.min(t*.5,1);ctx.globalAlpha=a;
    ctx.fillStyle="rgba(108,99,255,.18)";ctx.beginPath();ctx.moveTo(sx,sy+ch);yrs.forEach(y=>{const x=sx+((y-2020)/10)*cw,frac=Math.min((y-2020)/8,1);ctx.lineTo(x,sy+ch-frac*ch);});ctx.lineTo(sx+cw,sy+ch);ctx.closePath();ctx.fill();
    ctx.strokeStyle="#6C63FF";ctx.lineWidth=2.5;ctx.beginPath();yrs.forEach((y,i)=>{const x=sx+((y-2020)/10)*cw,frac=Math.min((y-2020)/8,1);i===0?ctx.moveTo(x,sy+ch-frac*ch):ctx.lineTo(x,sy+ch-frac*ch);});ctx.stroke();ctx.globalAlpha=1;
    ctx.strokeStyle="#E1705540";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(sx+cw,sy);ctx.stroke();
    ctx.fillStyle="#E17055";ctx.font="9px 'Space Grotesk'";ctx.textAlign="right";ctx.fillText("~300T tokens (Epoch AI)",sx+cw,sy-5);
    yrs.forEach(y=>{ctx.fillStyle="#2a3050";ctx.font="9px 'JetBrains Mono'";ctx.textAlign="center";ctx.fillText(y,sx+((y-2020)/10)*cw,sy+ch+14);});
    ctx.fillStyle="#6b7394";ctx.font="9.5px 'Space Grotesk'";ctx.textAlign="center";ctx.fillText("Synthetic data + multimodal + efficiency gains = path forward",w/2,sy+ch+30);
  },
  scaling:(ctx,w,h,t)=>{
    ctx.clearRect(0,0,w,h);
    const cw=w-60,ch=h-64,sx=40,sy=18;
    ctx.strokeStyle="#2a3050";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(sx,sy+ch);ctx.stroke();ctx.beginPath();ctx.moveTo(sx,sy+ch);ctx.lineTo(sx+cw,sy+ch);ctx.stroke();
    const a=Math.min(t*.55,1);ctx.strokeStyle="#6C63FF";ctx.lineWidth=3;ctx.globalAlpha=a;ctx.beginPath();
    for(let i=0;i<=100;i++){const x=sx+i*cw/100,logN=i/100*4,loss=2.9*Math.exp(-.42*logN),y=sy+ch*(1-Math.min(loss/2.9,1));i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);}
    ctx.stroke();ctx.globalAlpha=1;
    [{n:"GPT-1",l:.3,loss:2.7,c:"#74B9FF"},{n:"GPT-3",l:2.5,loss:1.42,c:"#A29BFE"},{n:"PaLM",l:2.9,loss:1.1,c:"#FD79A8"}].forEach(p=>{const x=sx+p.l/4*cw,y=sy+ch*(1-p.loss/2.9);ctx.fillStyle=p.c;ctx.beginPath();ctx.arc(x,y,5.5,0,Math.PI*2);ctx.fill();ctx.fillStyle="#e8eaf0";ctx.font="bold 9px 'Space Grotesk'";ctx.textAlign="left";ctx.fillText(p.n,x+8,y+4);});
    ctx.fillStyle="#6b7394";ctx.font="9.5px 'Space Grotesk'";ctx.textAlign="center";ctx.fillText("L(N) ∝ N^(-0.076) — smooth predictable power law",w/2,h-8);
  },
  chinchilla:(ctx,w,h,t)=>{
    ctx.clearRect(0,0,w,h);
    const cw=w-60,ch=h-64,sx=36,sy=18,maxN=200;
    ctx.strokeStyle="#2a3050";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(sx,sy+ch);ctx.stroke();ctx.beginPath();ctx.moveTo(sx,sy+ch);ctx.lineTo(sx+cw,sy+ch);ctx.stroke();
    const a=Math.min(t*.55,1);ctx.globalAlpha=a;
    ctx.strokeStyle="#6C63FF";ctx.lineWidth=2.5;ctx.beginPath();for(let n=1;n<=maxN;n++){const x=sx+n/maxN*cw,y=sy+ch*(1-n/maxN);n===1?ctx.moveTo(x,y):ctx.lineTo(x,y);}ctx.stroke();
    ctx.strokeStyle="#00C9A7";ctx.lineWidth=2.5;ctx.setLineDash([6,4]);ctx.beginPath();for(let n=1;n<=maxN;n++){const d=20*n,x=sx+n/maxN*cw,y=sy+ch*(1-Math.min(d/(20*maxN),1));n===1?ctx.moveTo(x,y):ctx.lineTo(x,y);}ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;
    [{n:"GPT-3",nm:175,dm:300,c:"#E17055"},{n:"Chinchilla",nm:70,dm:1400,c:"#00C9A7"}].forEach(m=>{const x=sx+m.nm/maxN*cw,y=sy+ch*(1-Math.min(m.dm/(20*maxN),1));ctx.fillStyle=m.c+"44";ctx.strokeStyle=m.c;ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,7,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle="#e8eaf0";ctx.font="bold 9px 'Space Grotesk'";ctx.textAlign="center";ctx.fillText(m.n,x,y-12);});
    ctx.fillStyle="#6C63FF";ctx.font="9.5px 'Space Grotesk'";ctx.textAlign="left";ctx.fillText("N (model size) →",sx,sy+ch+15);ctx.fillStyle="#00C9A7";ctx.textAlign="right";ctx.fillText("D* = 20·N →",sx+cw,sy+ch+15);
  },
  timeline:(ctx,w,h,t)=>{
    ctx.clearRect(0,0,w,h);
    const ms=[{n:"GPT-1",y:2018,p:.117,c:"#74B9FF"},{n:"GPT-3",y:2020,p:175,c:"#6C63FF"},{n:"PaLM",y:2022,p:540,c:"#FD79A8"},{n:"Mixtral",y:2023.5,p:46.7,act:12.9,c:"#00C9A7"},{n:"DSV3",y:2025,p:671,act:37,c:"#F7B731"}];
    const minY=2017,maxY=2026,logM=Math.log10(700),cw=w-56,ch=h-66,sx=32,sy=18;
    ctx.strokeStyle="#2a3050";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(sx,sy+ch);ctx.stroke();ctx.beginPath();ctx.moveTo(sx,sy+ch);ctx.lineTo(sx+cw,sy+ch);ctx.stroke();
    for(let y=2018;y<=2026;y+=2){const x=sx+((y-minY)/(maxY-minY))*cw;ctx.strokeStyle="#1f2535";ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(x,sy);ctx.lineTo(x,sy+ch);ctx.stroke();ctx.fillStyle="#2a3050";ctx.font="9px 'JetBrains Mono'";ctx.textAlign="center";ctx.fillText(y,x,sy+ch+14);}
    const a=Math.min(t*.42,1);
    ms.forEach((m,i)=>{const mx=sx+((m.y-minY)/(maxY-minY))*cw,logP=Math.log10(Math.max(m.p,.1)),my=sy+ch*(1-logP/logM),ia=Math.min((a*ms.length-i*.7),1);if(ia<=0)return;ctx.globalAlpha=ia;ctx.fillStyle=m.c+"44";ctx.strokeStyle=m.c;ctx.lineWidth=2;ctx.beginPath();ctx.arc(mx,my,m.act?7:5.5,0,Math.PI*2);ctx.fill();ctx.stroke();if(m.act){const al=Math.log10(m.act),ay=sy+ch*(1-al/logM);ctx.strokeStyle=m.c;ctx.lineWidth=1.5;ctx.setLineDash([3,3]);ctx.beginPath();ctx.moveTo(mx,my);ctx.lineTo(mx,ay);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle=m.c;ctx.beginPath();ctx.arc(mx,ay,3.5,0,Math.PI*2);ctx.fill();}ctx.fillStyle="#e8eaf0";ctx.font="bold 9px 'Space Grotesk'";ctx.textAlign="center";ctx.fillText(m.n,mx,my-11);ctx.globalAlpha=1;});
    ctx.fillStyle="#6C63FF";ctx.fillRect(sx+cw-175,sy+8,10,10);ctx.fillStyle="#9aa3bf";ctx.font="9px 'Space Grotesk'";ctx.textAlign="left";ctx.fillText("Dense",sx+cw-162,sy+17);ctx.fillStyle="#00C9A7";ctx.fillRect(sx+cw-175,sy+24,10,10);ctx.fillText("MoE (dot=active params)",sx+cw-162,sy+33);
  },
  params:(ctx,w,h,t)=>{
    ctx.clearRect(0,0,w,h);
    const comps=[{n:"W_Q  (d²)",s:1,c:"#6C63FF"},{n:"W_K  (d²)",s:1,c:"#6C63FF88"},{n:"W_V  (d²)",s:1,c:"#6C63FFAA"},{n:"W_O  (d²)",s:1,c:"#6C63FF66"},{n:"FFN W1  (4d²)",s:4,c:"#00C9A7"},{n:"FFN W2  (4d²)",s:4,c:"#00C9A788"},{n:"Norms (tiny)",s:.12,c:"#F7B731"}];
    const total=11.12,sx=165,bh=22,g=5,y0=18;
    ctx.fillStyle="#6b7394";ctx.font="9.5px 'Space Grotesk'";ctx.textAlign="left";ctx.fillText("Per-Layer Param Breakdown (proportional to d² units):",sx,y0-4);
    let cy=y0;
    comps.forEach((c,i)=>{const bw=(c.s/total)*(w-sx-16),ia=Math.min((t*.5-i*.1),1);if(ia<=0){cy+=bh+g;return;}ctx.globalAlpha=ia;ctx.fillStyle=c.c;ctx.fillRect(sx,cy,bw,bh-2);ctx.fillStyle="#e8eaf0";ctx.font="10px 'JetBrains Mono'";ctx.textAlign="left";ctx.textBaseline="middle";ctx.fillText(c.n,16,cy+bh/2-1);ctx.textBaseline="alphabetic";ctx.globalAlpha=1;cy+=bh+g;});
    const fy=cy+8;rr(ctx,14,fy,w-28,36,7);ctx.fillStyle="rgba(247,183,49,.1)";ctx.fill();ctx.strokeStyle="#F7B731";ctx.lineWidth=1.5;ctx.stroke();
    ctx.fillStyle="#F7B731";ctx.font="bold 11px 'JetBrains Mono'";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("Total ≈ n_layers × 12 × d_model² + vocab × d_model",w/2,fy+18);ctx.textBaseline="alphabetic";
    ctx.fillStyle="#6b7394";ctx.font="9.5px 'Space Grotesk'";ctx.textAlign="center";ctx.fillText("GPT-3: 96 × 12 × 12288² + 50K × 12288 ≈ 175B params",w/2,fy+44);
  },
  xent:(ctx,w,h,t)=>{
    ctx.clearRect(0,0,w,h);
    const vocab=["cat","dog","bird","fish","fox"],probs=[.65,.2,.08,.04,.03],sx=w*.2,maxW=w*.55,bh=26,g=5,sy=16;
    ctx.fillStyle="#6b7394";ctx.font="9.5px 'Space Grotesk'";ctx.textAlign="left";ctx.fillText("Softmax output probabilities over vocabulary:",sx,sy-5);
    vocab.forEach((word,i)=>{const bw=probs[i]*maxW*Math.min(t,1),isT=i===0,y=sy+i*(bh+g);ctx.fillStyle=isT?"rgba(0,201,167,.13)":"rgba(108,99,255,.07)";ctx.fillRect(sx,y,maxW,bh);ctx.fillStyle=isT?"#00C9A7":"#6C63FF88";ctx.fillRect(sx,y,bw,bh);if(isT){ctx.strokeStyle="#00C9A7";ctx.lineWidth=1.8;ctx.strokeRect(sx,y,maxW,bh);}ctx.fillStyle="#e8eaf0";ctx.font="12px 'JetBrains Mono'";ctx.textAlign="right";ctx.fillText(word,sx-8,y+bh/2+4);ctx.fillStyle="#c8d0e8";ctx.textAlign="right";ctx.fillText((probs[i]*100).toFixed(0)+"%",sx+maxW+42,y+bh/2+4);if(isT){ctx.fillStyle="#00C9A7";ctx.font="bold 9.5px 'JetBrains Mono'";ctx.fillText("← TRUE",sx+maxW+82,y+bh/2+4);}});
    const la=Math.min(t-.6,1);if(la>0){ctx.globalAlpha=la;const loss=-Math.log(.65),fy=sy+vocab.length*(bh+g)+10;rr(ctx,sx,fy,maxW,36,7);ctx.fillStyle="rgba(247,183,49,.12)";ctx.fill();ctx.strokeStyle="#F7B731";ctx.lineWidth=1.5;ctx.stroke();ctx.fillStyle="#F7B731";ctx.font="bold 11px 'JetBrains Mono'";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("L = -log(0.65) = "+loss.toFixed(3)+"  →  PPL = "+Math.exp(loss).toFixed(2),sx+maxW/2,fy+18);ctx.textBaseline="alphabetic";ctx.globalAlpha=1;}
  },
  roofline:(ctx,w,h,t)=>{
    ctx.clearRect(0,0,w,h);
    const sx=40,sy=20,cw=w-60,ch=h-50;
    ctx.strokeStyle="#2a3050";ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(sx,sy+ch);ctx.stroke();
    ctx.beginPath();ctx.moveTo(sx,sy+ch);ctx.lineTo(sx+cw,sy+ch);ctx.stroke();
    const rX = sx + cw*0.4;
    const rY = sy + ch*0.2;
    ctx.strokeStyle="#00C9A7";ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(sx,sy+ch);ctx.lineTo(rX,rY);ctx.lineTo(sx+cw,rY);ctx.stroke();
    const pX = sx + cw*0.1 + (Math.sin(t*0.5)*0.5+0.5)*cw*0.7;
    const isBW = pX < rX;
    const pY = isBW ? sy+ch - ((pX-sx)/(rX-sx))*(ch*0.8) : rY;
    ctx.fillStyle="#6C63FF";ctx.beginPath();ctx.arc(pX,pY,6,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#6b7394";ctx.font="10px 'Space Grotesk'";ctx.textAlign="center";
    ctx.fillText("Memory Bandwidth Bound", sx + cw*0.25, sy+ch*0.5);
    ctx.fillText("Compute Bound", sx + cw*0.7, rY+20);
    ctx.fillText("Operational Intensity (FLOPs/byte) →", sx+cw/2, sy+ch+20);
    ctx.save();ctx.translate(sx-15, sy+ch/2);ctx.rotate(-Math.PI/2);ctx.fillText("Performance",0,0);ctx.restore();
    ctx.fillStyle="#e8eaf0";ctx.fillText(isBW ? "Memory Bottleneck (Standard Attn)" : "Compute Bound (FlashAttention)", Math.max(sx+80, pX), pY-12);
  },
  specdecode:(ctx,w,h,t)=>{
    ctx.clearRect(0,0,w,h);
    const draftColor = "#6C63FF", targetColor = "#00C9A7", errorColor = "#E17055";
    const ts = (t*0.8)%1;
    const sx = 30, tw=25, th=25, gap=8;
    ctx.fillStyle="#6b7394";ctx.font="10px 'Space Grotesk'";ctx.textAlign="left";
    ctx.fillText("Draft Model (Fast, auto-regressive):", sx, 25);
    ctx.fillText("Target Model (Slow, parallel verify):", sx, 95);
    const draftCount = 4;
    for(let i=0; i<draftCount; i++) {
        let alpha = ts > (i+1)*0.1 ? 1 : 0.2;
        ctx.fillStyle=draftColor; ctx.globalAlpha=alpha*0.3;
        rr(ctx, sx+i*(tw+gap), 35, tw, th, 4); ctx.fill();
        ctx.globalAlpha=alpha; ctx.fillStyle=draftColor; ctx.font="10px 'JetBrains Mono'";
        ctx.fillText("t"+(i+1), sx+i*(tw+gap)+5, 52);
    }
    ctx.globalAlpha=1;
    if (ts > 0.6) {
        ctx.fillStyle=targetColor; ctx.globalAlpha=0.2;
        rr(ctx, sx, 105, draftCount*(tw+gap)-gap, th+10, 4); ctx.fill();
        ctx.globalAlpha=1; ctx.strokeStyle=targetColor; ctx.strokeRect(sx, 105, draftCount*(tw+gap)-gap, th+10);
        ctx.fillStyle=targetColor; ctx.fillText("Parallel Forward Pass", sx+5, 125);
        if (ts > 0.8) {
           const lx = sx+(draftCount-1)*(tw+gap);
           ctx.fillStyle=errorColor; ctx.globalAlpha=0.5; rr(ctx, lx, 105, tw, th+10, 4); ctx.fill();
           ctx.globalAlpha=1; ctx.fillStyle="#fff"; ctx.fillText("X", lx+8, 125);
           ctx.fillStyle=targetColor;
           rr(ctx, lx+tw+gap, 105, tw, th+10, 4); ctx.fill();
           ctx.fillStyle="#000"; ctx.fillText("✓", lx+tw+gap+8, 125);
        }
    }
    ctx.fillStyle="#6b7394";ctx.font="9.5px 'Space Grotesk'";ctx.textAlign="center";
    ctx.fillText("Generate K tokens quickly, verify all K in 1 step.", w/2, h-10);
  },
  sae:(ctx,w,h,t)=>{
    ctx.clearRect(0,0,w,h);
    const sx=w*0.15, dw=w*0.7;
    const y1=h*0.25, y3=h*0.7;
    ctx.fillStyle="#6b7394";ctx.font="11px 'Space Grotesk'";ctx.textAlign="center";
    ctx.fillText("Polysemantic Neuron (Dense)", w/2, y1-25);
    ctx.fillText("Monosemantic Features (Sparse Autoencoder)", w/2, y3+25);
    ctx.fillStyle="rgba(108,99,255,0.2)"; ctx.strokeStyle="#6C63FF";
    ctx.beginPath();ctx.arc(w/2, y1, 15, 0, Math.PI*2);ctx.fill();ctx.stroke();
    const nF = 5;
    const ts = (Math.sin(t*2)*0.5+0.5);
    const activeIdx = Math.floor((t*0.5)%nF);
    for(let i=0; i<nF; i++) {
       const fx = sx + i*(dw/(nF-1));
       const isActive = (i === activeIdx || i === (activeIdx+2)%nF);
       const alpha = isActive ? (0.2 + 0.8*ts) : 0.1;
       ctx.strokeStyle=`rgba(0,201,167,${alpha*0.5})`; ctx.lineWidth=1;
       ctx.beginPath();ctx.moveTo(w/2, y1+15);ctx.lineTo(fx, y3-15);ctx.stroke();
       ctx.fillStyle=`rgba(0,201,167,${alpha})`;
       ctx.beginPath();ctx.arc(fx, y3, 10, 0, Math.PI*2);ctx.fill();
       if (isActive) {
           ctx.fillStyle="#00C9A7"; ctx.font="9px 'JetBrains Mono'";
           ctx.fillText(i===activeIdx ? "DNA" : "Code", fx, y3-15);
       }
    }
  }
,
  anim_causal_mask: (ctx,w,h,t) => {
    ctx.clearRect(0,0,w,h);
    ctx.translate(w/2 - 60, h/2 - 60);
    const size = 120, cells = 8, cs = size/cells;
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    for(let i=0; i<cells; i++){
      for(let j=0; j<cells; j++){
        if(j > i) {
          ctx.fillStyle = 'rgba(255,0,0,'+(0.1 + Math.sin(t*2)*0.05)+')'; // masked
        } else {
          ctx.fillStyle = 'rgba(0,200,100,'+(0.2 + (i===cells-1 && j===Math.floor((t*4)%cells) ? 0.5 : 0))+')'; // active
        }
        ctx.fillRect(j*cs, i*cs, cs-1, cs-1);
        ctx.strokeRect(j*cs, i*cs, cs-1, cs-1);
      }
    }
    ctx.fillStyle = 'white'; ctx.font = '10px monospace';
    ctx.fillText('-inf', size + 10, 20);
    ctx.beginPath(); ctx.moveTo(size+5, 15); ctx.lineTo(size/2 + 20, size/4 - 10); ctx.strokeStyle = 'red'; ctx.stroke();
  },
  anim_mha_split: (ctx,w,h,t) => {
    ctx.clearRect(0,0,w,h);
    ctx.translate(w/2, h/2);
    ctx.fillStyle = '#6C63FF';
    ctx.fillRect(-80, -20, 30, 40); // QKV
    ctx.fillStyle = 'white'; ctx.font = '12px monospace'; ctx.fillText('QKV', -75, 5);
    
    for(let i=0; i<4; i++) {
      let y = -45 + i*30;
      ctx.fillStyle = ['#FF6B6B','#00C9A7','#F7B731','#A29BFE'][i];
      ctx.fillRect(-10, y, 20, 20); // Head
      
      // Lines
      ctx.beginPath();
      ctx.moveTo(-50, 0); ctx.lineTo(-30, y+10); ctx.lineTo(-10, y+10);
      ctx.moveTo(10, y+10); ctx.lineTo(30, y+10); ctx.lineTo(50, 0);
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      if(t*3 % 4 >= i && t*3 % 4 < i+1) ctx.strokeStyle = 'white';
      ctx.stroke();
    }
    ctx.fillStyle = '#6C63FF';
    ctx.fillRect(50, -20, 30, 40); // Concat
    ctx.fillStyle = 'white'; ctx.fillText('Out', 55, 5);
  },
  anim_gqa: (ctx,w,h,t) => {
    ctx.clearRect(0,0,w,h);
    ctx.translate(w/2 - 50, h/2);
    // Q heads (8)
    for(let i=0; i<8; i++){
      let y = -75 + i*20;
      ctx.fillStyle = '#FF6B6B';
      ctx.fillRect(-40, y, 15, 15);
      
      // KV heads (2 groups, so 4 Qs share 1 KV)
      let g = Math.floor(i/4);
      let kvy = -25 + g*60;
      
      ctx.beginPath();
      ctx.moveTo(-25, y+7.5);
      ctx.lineTo(20, kvy+10);
      ctx.strokeStyle = 'rgba(255,255,255,'+(0.1 + Math.sin(t*3 - i*0.5)*0.2 + 0.2)+')';
      ctx.stroke();
    }
    
    // KV pairs
    for(let i=0; i<2; i++){
      let kvy = -25 + i*60;
      ctx.fillStyle = '#00C9A7'; ctx.fillRect(20, kvy, 15, 20); // K
      ctx.fillStyle = '#F7B731'; ctx.fillRect(37, kvy, 15, 20); // V
    }
    ctx.fillStyle='white'; ctx.font='11px sans-serif';
    ctx.fillText('8 Q Heads', -45, 95);
    ctx.fillText('2 KV Groups', 10, 95);
  },
  anim_cross_attn: (ctx,w,h,t) => {
    ctx.clearRect(0,0,w,h);
    ctx.translate(w/2, h/2);
    // Text Q
    ctx.fillStyle = '#FF6B6B'; ctx.fillRect(-60, -20, 30, 40);
    ctx.fillStyle = 'white'; ctx.font = '12px sans-serif'; ctx.fillText('Q (Text)', -65, 35);
    
    // Image KV
    ctx.fillStyle = '#00C9A7'; ctx.fillRect(30, -30, 20, 60);
    ctx.fillStyle = '#F7B731'; ctx.fillRect(52, -30, 20, 60);
    ctx.fillStyle = 'white'; ctx.fillText('K, V (Image)', 25, 45);
    
    // Beams
    ctx.beginPath();
    ctx.moveTo(-30, 0); ctx.lineTo(30, Math.sin(t*4)*20);
    ctx.strokeStyle = 'rgba(255,107,107,0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();
  },
  anim_sparse_window: (ctx,w,h,t) => {
    ctx.clearRect(0,0,w,h);
    ctx.translate(w/2 - 40, h/2 - 40);
    const size = 80, cells = 10, cs = size/cells;
    ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1;
    for(let i=0; i<cells; i++){
      for(let j=0; j<cells; j++){
        ctx.strokeRect(j*cs, i*cs, cs-1, cs-1);
        let dist = Math.abs(i - j);
        let active = dist <= 1 || j === 0 || i === 0; // sliding window + global token at 0
        if(active) {
          ctx.fillStyle = 'rgba(0,200,100,'+(0.3 + Math.sin(t*3 + i*0.5)*0.2)+')';
          ctx.fillRect(j*cs, i*cs, cs-1, cs-1);
        }
      }
    }
    ctx.fillStyle = 'white'; ctx.font='11px sans-serif';
    ctx.fillText('O(n * w) active', -5, size + 20);
  },
  anim_linear_kernel: (ctx,w,h,t) => {
    ctx.clearRect(0,0,w,h);
    ctx.translate(w/2, h/2);
    // O(n^2) visual
    ctx.fillStyle = 'rgba(255,107,107,0.3)';
    ctx.strokeStyle = '#FF6B6B';
    let s1 = 40 + Math.sin(t*2)*5;
    ctx.fillRect(-60-s1/2, -s1/2, s1, s1);
    ctx.strokeRect(-60-s1/2, -s1/2, s1, s1);
    ctx.fillStyle = 'white'; ctx.font = '11px sans-serif'; ctx.fillText('O(n²)', -75, s1/2 + 15);
    
    // O(n) visual
    ctx.fillStyle = 'rgba(0,201,167,0.3)';
    ctx.strokeStyle = '#00C9A7';
    let w2 = 10, h2 = 40;
    ctx.fillRect(40-w2/2, -h2/2, w2, h2);
    ctx.strokeRect(40-w2/2, -h2/2, w2, h2);
    ctx.fillStyle = 'white'; ctx.fillText('O(n)', 30, h2/2 + 15);
    
    ctx.fillText('vs', -5, 5);
  },
  anim_flash_tiling: (ctx,w,h,t) => {
    ctx.clearRect(0,0,w,h);
    ctx.translate(w/2, h/2);
    
    // Main Memory (HBM)
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.strokeRect(-80, -60, 60, 120);
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '10px sans-serif'; ctx.fillText('GPU HBM', -70, -65);
    
    // SRAM (Fast cache)
    ctx.strokeStyle = '#F7B731';
    ctx.strokeRect(20, -20, 60, 40);
    ctx.fillStyle = '#F7B731'; ctx.fillText('SRAM', 35, -25);
    
    // Tiles moving
    let tileY = -50 + ((t*40)%100);
    if(tileY > 50) tileY = -50;
    
    ctx.fillStyle = '#00C9A7';
    ctx.fillRect(-70, tileY, 40, 15); // Tile in HBM
    
    // Transfer line
    ctx.beginPath(); ctx.moveTo(-30, tileY+7.5); ctx.lineTo(20, 0); 
    ctx.strokeStyle = 'rgba(0,201,167,'+Math.max(0, 1 - Math.abs(tileY)/50)+')';
    ctx.lineWidth = 2; ctx.stroke();
    
    ctx.fillRect(30, -10, 40, 20); // Tile in SRAM
  }
};

// ─── CANVAS MANAGER ─────────────────────────────────────────────────
const animFrames={};
function startAnim(canvasId,type){
  if(animFrames[canvasId])cancelAnimationFrame(animFrames[canvasId]);
  const canvas=document.getElementById(canvasId);if(!canvas||!ANIMS[type])return;
  const ctx=canvas.getContext('2d');let start=null;const dpr=window.devicePixelRatio||1;
  const loop=(ts)=>{
    if(!start)start=ts;const t=(ts-start)/1000;
    const W=canvas.offsetWidth,H=canvas.offsetHeight;
    if(canvas.width!==W*dpr||canvas.height!==H*dpr){
      canvas.width=W*dpr;
      canvas.height=H*dpr;
    }
    ctx.save();
    ctx.scale(dpr,dpr);
    let vW = W, vH = H;
    const minW = 540;
    if(W > 0 && W < minW) {
      const scale = W / minW;
      ctx.scale(scale, scale);
      vW = minW;
      vH = H / scale;
    }
    try{ANIMS[type](ctx,vW,vH,t);}catch(e){}
    ctx.restore();
    animFrames[canvasId]=requestAnimationFrame(loop);
  };
  animFrames[canvasId]=requestAnimationFrame(loop);
}
function stopAnim(canvasId){if(animFrames[canvasId]){cancelAnimationFrame(animFrames[canvasId]);delete animFrames[canvasId];}}

// ─── MATH ────────────────────────────────────────────────────────────
function renderMath(){if(window.MathJax){try{MathJax.typesetPromise().catch(()=>{});}catch(e){}}}

// ─── SEARCH & CITATIONS ────────────────────────────────────────────────
function onSearch(q){searchQ=q.toLowerCase();renderMain();}
function highlight(text,q){if(!q)return escHtml(text);const re=new RegExp('('+q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')', 'gi');return escHtml(text).replace(re,'<span class="hl">$1</span>');}
function showCiteTooltip(e, key) {
    let tt = document.getElementById('cite-tooltip');
    if(!tt) {
        tt = document.createElement('div');
        tt.id = 'cite-tooltip';
        tt.className = 'cite-tooltip';
        document.body.appendChild(tt);
    }
    let paper = null;
    if(typeof APPENDIX !== 'undefined' && APPENDIX.cats) {
        for(const cat of APPENDIX.cats) {
            paper = cat.papers.find(p => p.t.includes(key) || p.a.includes(key));
            if(paper) break;
        }
    }
    if(!paper) {
        tt.innerHTML = '<div class="cite-tt-title">Reference: '+key+'</div><div class="cite-tt-auth">See appendix for details</div>';
    } else {
        tt.innerHTML = '<div class="cite-tt-title">'+escHtml(paper.t)+'</div><div class="cite-tt-auth">'+escHtml(paper.a)+'</div><a class="cite-tt-link" href="https://arxiv.org/search/cs?query='+encodeURIComponent(paper.t)+'&searchtype=title" target="_blank" onclick="event.stopPropagation()">Search on arXiv ↗</a>';
    }
    tt.style.left = e.clientX + 'px';
    tt.style.top = (e.clientY + 20) + 'px';
    tt.classList.add('show');
    if (e.clientX + 280 > window.innerWidth) { tt.style.left = (window.innerWidth - 290) + 'px'; }
}
function hideCiteTooltip() {
    const tt = document.getElementById('cite-tooltip');
    if(tt) tt.classList.remove('show');
}

// ─── CARD TOGGLE ─────────────────────────────────────────────────────
function toggleCard(cardId,subId,animType,color){
  const card=document.getElementById(cardId);if(!card)return;
  const body=card.querySelector('.card-body'),canvasId='c-'+subId;
  if(expandedCards.has(subId)){
    expandedCards.delete(subId);card.classList.remove('open');body.style.display='none';stopAnim(canvasId);
  }else{
    expandedCards.add(subId);card.classList.add('open');body.style.display='';
    if(animType&&ANIMS[animType]){setTimeout(()=>startAnim(canvasId,animType),50);}
    setTimeout(() => { if(window.MathJax){ try{MathJax.typesetPromise([body]).catch(()=>{});}catch(e){} } },50);
    if(window.Prism){
      const codeEl = body.querySelector('code[class*="language-"]');
      if(codeEl) Prism.highlightElement(codeEl);
    }
  }
}
window.copyCode = function(e, subId) {
  e.stopPropagation();
  const codeText = document.getElementById('code-'+subId).innerText;
  navigator.clipboard.writeText(codeText).then(() => {
    const btn = e.target;
    const old = btn.innerText;
    btn.innerText = 'Copied!';
    setTimeout(() => btn.innerText = old, 1500);
  });
};

window.showCiteTooltip = function(e, key) {
  const tt = document.getElementById('citeTooltip');
  if(!tt) return;
  // Try to find the paper in APPENDIX by author/title match or exact key
  let ref;
  for (const cat of APPENDIX.cats) {
    const found = cat.papers.find(p => p.a.includes(key) || p.t.includes(key));
    if (found) { ref = found; break; }
  }
  if(!ref) {
    // Basic fallback lookup
    const lookup = {
      'Vaswani2017': { t: 'Attention Is All You Need', a: 'Vaswani et al.', v: 'NeurIPS 2017' },
      'Radford2018': { t: 'Improving Language Understanding by Generative Pre-Training', a: 'Radford et al.', v: 'OpenAI 2018' },
      'Devlin2018': { t: 'BERT: Pre-training of Deep Bidirectional Transformers', a: 'Devlin et al.', v: 'NAACL 2019' },
      'Brown2020': { t: 'Language Models are Few-Shot Learners', a: 'Brown et al.', v: 'NeurIPS 2020' },
      'Kaplan2020': { t: 'Scaling Laws for Neural Language Models', a: 'Kaplan et al.', v: 'OpenAI 2020' },
      'Hoffmann2022': { t: 'Training Compute-Optimal Large Language Models', a: 'Hoffmann et al.', v: 'DeepMind 2022' }
    };
    ref = lookup[key];
  }
  if(ref) {
    tt.innerHTML = '<div class="cite-title">'+ref.t+'</div><div class="cite-authors">'+ref.a+' &middot; '+ref.v+'</div>';
  } else {
    tt.innerHTML = '<div class="cite-title">'+key+'</div><div class="cite-authors">Reference details unavailable</div>';
  }
  
  // Position tooltip safely on screen
  let x = e.clientX + 15;
  let y = e.clientY + 15;
  tt.style.display = 'block';
  tt.style.left = x + 'px';
  tt.style.top = y + 'px';
  tt.classList.add('show');
};

window.hideCiteTooltip = function() {
  const tt = document.getElementById('citeTooltip');
  if(tt) tt.classList.remove('show');
};

// ─── SIDEBAR ─────────────────────────────────────────────────────────
function buildNav(){
  const nav=document.getElementById('navScroll');if(!nav)return;
  const secs=SECTIONS.map(s=>`<button class="nav-item${s.id===activeSection?' active':''}" onclick="goSection('${s.id}')"><span class="nav-dot" style="background:${s.color}"></span><span class="nav-icon">${s.icon}</span>${s.label}</button>`).join('');
  nav.innerHTML='<div class="nav-label">Sections</div>'+secs+'<div class="nav-label">References</div><button class="nav-item'+(activeSection==='appendix'?' active':'')+ '" onclick="goSection(\'appendix\')"><span class="nav-dot" style="background:#6b7394"></span><span class="nav-icon">📚</span>Appendix & Reading</button><button class="nav-item'+(activeSection==='glossary'?' active':'')+ '" onclick="goSection(\'glossary\')"><span class="nav-dot" style="background:#FDCB6E"></span><span class="nav-icon">📖</span>Concept Glossary</button><div class="nav-label">Export</div><button class="nav-item'+(activeSection==='download'?' active':'')+ '" onclick="goSection(\'download\')"><span class="nav-dot" style="background:#55EFC4"></span><span class="nav-icon">⬇️</span>Download Report</button>';
}
function goSection(id){activeSection=id;buildNav();renderMain();window.scrollTo(0,0);}
function toggleSidebar(){document.getElementById('sidebar').classList.toggle('open');}
window.addEventListener('scroll',()=>{const d=document.documentElement;document.getElementById('prog').style.width=(d.scrollTop/(d.scrollHeight-d.clientHeight)*100)+'%';});

// ─── RENDER ──────────────────────────────────────────────────────────
function renderMain(){
  const main=document.getElementById('mainContent');if(!main)return;
  Object.keys(animFrames).forEach(id=>{cancelAnimationFrame(animFrames[id]);delete animFrames[id];});
  expandedCards.clear();
  if(activeSection==='appendix'){main.innerHTML=buildAppendix();return;}
  if(activeSection==='glossary'){main.innerHTML=buildGlossary();return;}
  if(activeSection==='download'){main.innerHTML=buildDownload();return;}
  const sec=SECTIONS.find(s=>s.id===activeSection);
  if(!sec){main.innerHTML=buildHero();return;}
  main.innerHTML=buildSection(sec);
  setTimeout(renderMath,200);
}

function buildHero(){
  return '<div class="hero fade"><div class="hero-eye">Research Report · 2026</div><h1 class="hero-title">The Architectural<br>Evolution of LLMs</h1><p class="hero-desc">A comprehensive, mathematically grounded deep-dive into every major LLM and tokenizer architecture from 2017 through 2026 — built from first principles, no ML knowledge assumed.</p><div class="hero-stats"><div><div class="stat-num" style="color:#6C63FF">13+</div><div class="stat-lab">Architecture Families</div></div><div><div class="stat-num" style="color:#00C9A7">10</div><div class="stat-lab">Deep-Dive Sections</div></div><div><div class="stat-num" style="color:#F7B731">56.2×</div><div class="stat-lab">SSA Speedup @ 1M tokens</div></div><div><div class="stat-num" style="color:#FD79A8">~2028</div><div class="stat-lab">Data Wall (Epoch AI)</div></div></div><div class="hero-btns"><button class="btn btn-pri" onclick="goSection(\'foundations\')">Start Reading →</button><button class="btn btn-ghost" onclick="goSection(\'download\')">Download Report</button></div></div>';
}

const PREREQS = {
  specdecode:"kvcache", flashhw:"o2", moe:"ffn", chinchilla:"kaplan", interp:"ffn", rope:"posenc", attn:"vdot", mha:"attn", sft:"xent", dpo:"rlhf", loras:"gpt4", goodhart:"mmlu", vllm:"kvcache", quant:"param_scale", ssa:"o2", mmlu:"xent"
};
function getPrereqHtml(subId) {
  const pid = PREREQS[subId]; if(!pid) return '';
  let ptitle = pid;
  for(let s of SECTIONS) { const sd=s.subs.find(x=>x.id===pid); if(sd) { ptitle=sd.title; break; } }
  return '<div class="prereq" style="margin-top:12px;font-size:0.9em;color:var(--muted)">↳ <span style="opacity:0.7">Prerequisite context:</span> <a href="#" onclick="event.stopPropagation();onSearch(\''+ptitle.replace(/'/g,"\\'")+'\');return false;" style="color:var(--pri);text-decoration:none">'+ptitle+'</a></div>';
}
function copyMath(e, tex) {
  e.stopPropagation();
  navigator.clipboard.writeText('$$' + tex + '$$').then(() => {
    const btn = e.target;
    const old = btn.innerText;
    btn.innerText = 'Copied!';
    setTimeout(() => btn.innerText = old, 1500);
  });
}

function buildSection(sec){
  const q=searchQ;
  let subs=sec.subs;
  if(q)subs=subs.filter(s=>s.title.toLowerCase().includes(q)||s.body.toLowerCase().includes(q));
  
  const wordCount = sec.subs.reduce((acc, sub) => acc + sub.body.split(' ').length, 0);
  const readMins = Math.max(1, Math.ceil(wordCount / 150));
  
  const cards=subs.map(sub=>{
    const cardId='card-'+sub.id;
    let bodyText = sub.body;
    bodyText = bodyText.replace(/\[\[(.*?)\]\]/g, (match, key) => '<cite class="citation" data-key="'+key+'" onmouseenter="showCiteTooltip(event, \''+key+'\')" onmouseleave="hideCiteTooltip()">'+key+'</cite>');
    const animHtml=sub.anim&&ANIMS[sub.anim]?'<div class="anim-wrap"><span class="anim-lbl" style="color:'+sec.color+'">'+sub.anim.replace(/_/g,' ')+'</span><canvas id="c-'+sub.id+'" class="anim-canvas"></canvas></div>':'';
    const mathHtml=sub.math?'<div class="math-blk">'+sub.math.eqs.map(eq=>'<div class="math-row"><span class="math-lbl">'+escHtml(eq.l)+'</span><div style="flex:1;display:flex;align-items:center;justify-content:space-between"><span class="math-eq" style="flex:1;overflow-x:auto">$$'+eq.t+'$$</span><button class="math-copy" onclick="copyMath(event, \''+escHtml(eq.t).replace(/\\/g,'\\\\').replace(/'/g,"\\'")+'\')">Copy</button></div></div>').join('')+'</div>':'';
    const codeHtml=sub.code?'<div class="code-blk"><div class="code-hdr"><span class="code-lang">'+escHtml(sub.code.lang)+'</span><button class="copy-btn" onclick="copyCode(event,\''+sub.id+'\')">Copy</button></div><pre><code id="code-'+sub.id+'" class="language-'+sub.code.lang+'">'+escHtml(sub.code.text)+'</code></pre></div>':'';
    const breadcrumb = '<div class="breadcrumb" style="font-size:0.85em;color:var(--muted);margin-bottom:12px;text-transform:uppercase;letter-spacing:1px">'+sec.label+' / '+sub.title+'</div>';
    const bodyHtml='<div class="card-text">'+breadcrumb+'<p class="bdy-txt">'+highlight(bodyText,q)+'</p>'+getPrereqHtml(sub.id)+'</div><div class="card-visuals">'+animHtml+mathHtml+codeHtml+'</div>';
    const diff = sub.math ? '<span class="diff diff-hard" style="font-size:10px;padding:2px 6px;border-radius:4px;background:rgba(225,112,85,0.15);color:#E17055;margin-left:auto">Advanced</span>' : '<span class="diff diff-med" style="font-size:10px;padding:2px 6px;border-radius:4px;background:rgba(247,183,49,0.15);color:#F7B731;margin-left:auto">Intermediate</span>';
    return '<div class="card'+(expandedCards.has(sub.id)?' open':'')+'" id="'+cardId+'"><div class="card-hdr" onclick="toggleCard(\''+cardId+'\',\''+sub.id+'\',\''+(sub.anim||'')+'\',\''+sec.color+'\')"><div class="card-ttl" style="display:flex;align-items:center;gap:12px;width:100%">'+highlight(sub.title,q)+diff+'</div><div class="chev"><svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M3.5 5.5l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></div></div><div class="card-body" onclick="event.stopPropagation()" style="display:none">'+bodyHtml+'</div></div>';
  }).join('');
  const cardsHtml = '<div class="cards-grid">' + cards + '</div>';
  return '<div class="section fade"><div class="sec-eye" style="color:'+sec.color+'">'+sec.icon+' '+sec.label+' <span style="color:var(--muted)">• ~'+readMins+' min read</span></div><h2 class="sec-title">'+escHtml(sec.title)+'</h2>'+(cards?cardsHtml:'<p style="color:var(--muted)">No results for "'+escHtml(searchQ)+'".</p>')+'</div>';
}

function buildAppendix(){
  const cats=APPENDIX.cats.map(cat=>'<div class="app-cat">'+escHtml(cat.label)+'</div>'+cat.papers.map(p=>'<div class="paper"><div class="paper-auth">'+escHtml(p.a)+'</div><div class="paper-ttl">'+escHtml(p.t)+'</div><div class="paper-venue">'+escHtml(p.v)+'</div><div class="paper-desc">'+escHtml(p.d)+'</div>'+(p.url?'<a class="paper-link" href="'+p.url+'" target="_blank" rel="noopener">arXiv ↗</a>':'')+'</div>').join('')).join('');
  return '<div class="section fade"><div class="sec-eye" style="color:#6b7394">📚 Essential Reading</div><h2 class="sec-title">Appendix — Annotated Bibliography</h2>'+cats+'</div>';
}

function buildGlossary(){
  const terms=GLOSSARY.map(g=>'<div class="paper"><div class="paper-ttl" style="color:var(--c7)">'+escHtml(g.term)+'</div><div class="paper-desc">'+escHtml(g.def)+'</div></div>').join('');
  return '<div class="section fade"><div class="sec-eye" style="color:#FDCB6E">📖 Definitions</div><h2 class="sec-title">Concept Glossary</h2>'+terms+'</div>';
}

function buildDownload(){
  const secOpts=SECTIONS.map(s=>'<label class="dl-sec-cb"><input type="checkbox" '+(dlSections.has(s.id)?'checked':'')+' onchange="toggleDlSec(\''+s.id+'\',this.checked)"/><span>'+s.icon+' '+s.label+'</span></label>').join('');
  return '<div class="dl-panel fade"><div class="dl-title">Download Report</div><div class="dl-sub">Export the full LLM Atlas as a document or select sections.</div><div class="dl-modes"><div class="dl-mode'+(dlMode==='full'?' sel':'')+'" onclick="setDlMode(\'full\')"><div class="dl-mode-t">Full Report</div><div class="dl-mode-s">All '+SECTIONS.length+' sections + appendix</div></div><div class="dl-mode'+(dlMode==='sections'?' sel':'')+'" onclick="setDlMode(\'sections\')"><div class="dl-mode-t">Selected Sections</div><div class="dl-mode-s">Choose which to include</div></div><div class="dl-mode'+(dlMode==='json'?' sel':'')+'" onclick="setDlMode(\'json\')"><div class="dl-mode-t">Raw JSON</div><div class="dl-mode-s">Structured data file</div></div></div>'+(dlMode==='sections'?'<div class="dl-secs">'+secOpts+'</div>':'')+'<div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:16px"><button class="btn btn-pri" onclick="doDownload(\'html\')">⬇ Download HTML</button><button class="btn btn-ghost" onclick="doDownload(\'md\')">⬇ Download Markdown</button>'+(dlMode==='json'?'<button class="btn btn-ghost" onclick="doDownload(\'json\')">⬇ Download JSON</button>':'')+'</div></div>';
}

function toggleDlSec(id,checked){if(checked)dlSections.add(id);else dlSections.delete(id);document.getElementById('mainContent').innerHTML=buildDownload();}
function setDlMode(m){dlMode=m;document.getElementById('mainContent').innerHTML=buildDownload();}

function doDownload(fmt){
  if(fmt==='json'){const blob=new Blob([JSON.stringify({sections:SECTIONS,appendix:APPENDIX},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='llm-atlas-data.json';a.click();return;}
  const inc=dlMode==='full'?SECTIONS:SECTIONS.filter(s=>dlSections.has(s.id));
  if(fmt==='md'){let md='# LLM Atlas — Architectural Evolution 2017–2026\n\n';inc.forEach(sec=>{md+='## '+sec.label+': '+sec.title+'\n\n';sec.subs.forEach(sub=>{md+='### '+sub.title+'\n\n'+sub.body+'\n\n';if(sub.math)sub.math.eqs.forEach(eq=>{md+='**'+eq.l+':** $'+eq.t+'$\n\n';});});});md+='## Appendix\n\n';APPENDIX.cats.forEach(cat=>{md+='### '+cat.label+'\n\n';cat.papers.forEach(p=>{md+='**'+p.a+'** — *'+p.t+'* ('+p.v+')\n'+p.d+'\n\n';});});const blob=new Blob([md],{type:'text/markdown'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='llm-atlas.md';a.click();return;}
  const body='<style>body{font-family:Georgia,serif;max-width:860px;margin:40px auto;color:#1a1a2e;line-height:1.75}h1{font-size:2.2em;border-bottom:2px solid #6C63FF;padding-bottom:12px}h2{font-size:1.5em;color:#6C63FF;margin-top:48px;border-left:4px solid #6C63FF;padding-left:14px}h3{font-size:1.15em;margin-top:28px;color:#2a2a4a}.math{background:#f4f6ff;border:1px solid #d0d4f0;border-radius:6px;padding:10px 16px;font-family:monospace;margin:12px 0}.lbl{color:#6C63FF;font-size:.85em;font-weight:bold}</style><h1>LLM Atlas — Architectural Evolution 2017–2026</h1>';
  const content=inc.map(sec=>'<h2>'+sec.icon+' '+sec.label+': '+sec.title+'</h2>'+sec.subs.map(sub=>'<h3>'+sub.title+'</h3><p>'+sub.body.replace(/\n/g,'<br>')+'</p>'+(sub.math?'<div class="math">'+sub.math.eqs.map(eq=>'<div><span class="lbl">'+eq.l+':</span> \\('+eq.t+'\\)</div>').join('')+'</div>':'')).join('')).join('');
  const app='<h2>📚 Appendix</h2>'+APPENDIX.cats.map(cat=>'<h3>'+cat.label+'</h3>'+cat.papers.map(p=>'<p><strong>'+p.a+'</strong> — <em>'+p.t+'</em> ('+p.v+')<br>'+p.d+'</p>').join('')).join('');
  const html='<!DOCTYPE html><html><head><meta charset="UTF-8"><title>LLM Atlas</title><script src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.2/es5/tex-chtml.min.js"><\/script></head><body>'+body+content+app+'</body></html>';
  const blob=new Blob([html],{type:'text/html'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='llm-atlas.html';a.click();
}

// ─── BOOT ─────────────────────────────────────────────────────────────
buildNav();
document.getElementById('mainContent').innerHTML = buildHero();
