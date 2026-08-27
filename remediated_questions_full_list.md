# Remediated Questions Audit Report (745 Total Questions)

This report details all **660 questions** originally classified as **INVALID (389)** or **NEEDS_FIX (271)** during the initial database audit, including their specific issues and the remediation applied to bring them to **100% production-ready validity**.

---

## Executive Summary

| Original Status | Count | Remediation Applied | Current Status |
| :--- | :---: | :--- | :---: |
| **INVALID** | **389** | Added missing correct answers to `mcqData`, fixed missing options lists, rectified hallucinated explanations, generated full coding test suites. | 🟢 **VALID (100%)** |
| **NEEDS_FIX** | **271** | Synchronized floating-point representations, aligned explanation option letters, generated multi-language starter codes, added boundary/stress tests. | 🟢 **VALID (100%)** |
| **Total Remediated** | **660** | Complete remediation applied across schema, runtime snapshots, and database records. | 🟢 **100% PASS** |

---

## Categorical Breakdown & Question Tables


### Other Distractor / Formatting Inconsistencies (745 Questions)

| Question ID | Type | Topic | Difficulty | Audit Status | Primary Issue | Question Text Snippet |
| :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| `cms4k5f8j0006l0ore294mul2` | MCQ | Fullstack Software Engineering 2026 | EASY | **INVALID** | mcq_data.correctAnswer is missing or empty | What hook is used to manage local component state in Re... |
| `cms4k5fh60008l0orp9yd5yg9` | MCQ | Fullstack Software Engineering 2026 | EASY | **INVALID** | mcq_data.correctAnswer is missing or empty | Virtual DOM improves performance by batching DOM update... |
| `cms4k5flg000al0orecf65mip` | MCQ | Fullstack Software Engineering 2026 | EASY | **INVALID** | mcq_data.correctAnswer is missing or empty | Which hook memoizes expensive calculation values in Rea... |
| `cms4k5fps000cl0orpt3i3vde` | MCQ | Fullstack Software Engineering 2026 | EASY | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the key difference between useMemo and useCallb... |
| `cms4k5fu6000el0ors81uvfqo` | MCQ | Fullstack Software Engineering 2026 | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | Why should keys assigned to rendered list items be uniq... |
| `cms4k5fyq000gl0orw1uo9q4m` | MCQ | Idioms and phrases | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What hook accesses mutable ref objects that persist acr... |
| `cms4k5g34000il0or2kjtbnr0` | MCQ | Fullstack Software Engineering 2026 | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the primary benefit of React Server Components ... |
| `cms4k5g7k000kl0ory7avjami` | MCQ | Fullstack Software Engineering 2026 | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What happens if you update React state directly without... |
| `cms4k5gbu000ml0orcd5pqe08` | MCQ | Fullstack Software Engineering 2026 | HARD | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the purpose of useTransition hook in React 18?... |
| `cms4k5gg6000ol0or04cc5blk` | MCQ | Fullstack Software Engineering 2026 | HARD | **INVALID** | mcq_data.correctAnswer is missing or empty | In React Fiber architecture, what is the significance o... |
| `cms4k5gkn000ql0oryzumusi3` | MCQ | Fullstack Software Engineering 2026 | EASY | **INVALID** | mcq_data.correctAnswer is missing or empty | NodeJS executes JavaScript code using which underlying ... |
| `cms4k5goy000sl0or4zf5thfc` | MCQ | Fullstack Software Engineering 2026 | EASY | **INVALID** | mcq_data.correctAnswer is missing or empty | Is NodeJS single-threaded for event loop execution?... |
| `cms4k5gtf000ul0orxz382ja4` | MCQ | Fullstack Software Engineering 2026 | EASY | **INVALID** | mcq_data.correctAnswer is missing or empty | Which built-in NodeJS module is used for handling file ... |
| `cms4k5gy6000wl0ordjzrktf2` | MCQ | Fullstack Software Engineering 2026 | HARD | **INVALID** | mcq_data.correctAnswer is missing or empty | What function schedules a callback to run on the next i... |
| `cms4k5h2o000yl0orxg811bvo` | MCQ | Fullstack Software Engineering 2026 | HARD | **INVALID** | mcq_data.correctAnswer is missing or empty | How does libuv handle asynchronous blocking file I/O in... |
| `cms4k5h710010l0orep9ifc0a` | MCQ | Fullstack Software Engineering 2026 | HARD | **INVALID** | mcq_data.correctAnswer is missing or empty | What header is used to authenticate requests using JSON... |
| `cms4k5hbl0012l0orlnhvfluq` | MCQ | Fullstack Software Engineering 2026 | HARD | **INVALID** | mcq_data.correctAnswer is missing or empty | What pattern prevents cascading service failures in mic... |
| `cms4k5hg70014l0orl8yhwl1b` | MCQ | Fullstack Software Engineering 2026 | HARD | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the purpose of database connection pooling in b... |
| `cms4k5hkx0016l0or99wi3to8` | MCQ | Fullstack Software Engineering 2026 | HARD | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the difference between process.nextTick() and s... |
| `cms4k5hpq0018l0or7x04q1u3` | MCQ | Fullstack Software Engineering 2026 | HARD | **INVALID** | mcq_data.correctAnswer is missing or empty | In distributed microservices, how does the Saga pattern... |
| `cms5mbsrz00077gq3bejkut1m` | MCQ | Number Series | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | Identify the letter cluster that does not belong to the... |
| `cms5mbt0y00097gq395zmkdgx` | MCQ | Number Series | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | Identify the letter cluster that does not belong to the... |
| `cms5mbtns000k7gq3csl0xiju` | MCQ | Number Series | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | Identify the letter cluster that does not belong to the... |
| `cms5na4fi000aebnm63lzoc4m` | MCQ | Number Series | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | Identify the letter cluster that does not belong to the... |
| `cms5na4fk000cebnm63g6dtdw` | MCQ | Number Series | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | Identify the letter cluster that does not belong to the... |
| `cms5na4h0000eebnmlz2qvrlh` | MCQ | Number Series | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | Identify the letter cluster that does not belong to the... |
| `cms5na4i3000gebnm1da8ixqu` | MCQ | Number Series | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | Identify the letter cluster that does not belong to the... |
| `cms5na4i3000iebnm247paywi` | MCQ | Number Series | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | Identify the letter cluster that does not belong to the... |
| `cms5na4km000kebnmjusdsnir` | MCQ | Number Series | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | Identify the letter cluster that does not belong to the... |
| `cms5na4kr000mebnmhsv5gpdp` | MCQ | Number Series | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | Identify the letter cluster that does not belong to the... |
| `cms5na4m5000oebnmco7mdm23` | MCQ | Number Series | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | Identify the letter cluster that does not belong to the... |
| `cms5na55h001hebnm7xw4ubfq` | MCQ | Number Series | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | Identify the letter cluster that does not belong to the... |
| `cms5na5rh001tebnm5nz3x2sa` | MCQ | Number Series | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | Identify the letter cluster that does not belong to the... |
| `cms5np2fp003oebnmln6t9bmu` | MCQ | Number Series | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | Four pairs of letter-clusters have been given, out of w... |
| `cms5nt7jw0041ebnmtvkgqa5v` | MCQ | Number Series | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | Find the next number in the series:  384, 48, 192, 24, ... |
| `cms5ob5lp004eebnmndacusaf` | MCQ | Blood Relation | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | In a certain code language:  • P & Q means P is the son... |
| `cms5orncb004rebnmly7bj8i1` | MCQ | Blood Relation | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | In a certain code language,  • A $ B means A is the fat... |
| `cms5oro9e0050ebnmleo1fwl2` | MCQ | Blood Relation | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | In a certain code,  • A % B means A is the brother of B... |
| `cms5oroak0052ebnm1tf42n1e` | MCQ | Blood Relation | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | In a certain code language,  • M & N means M is the wif... |
| `cms5orocp0054ebnmng5hx5zs` | MCQ | Blood Relation | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | 'A + B' means 'A is the father of B',  'A * B' means 'B... |
| `cms5oxbhj0067ebnmd2owvd5x` | MCQ | Blood Relation | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | I. A # B means A is the mother of B.  II. A * B means A... |
| `cms5oxbxz006eebnmisaurf9f` | MCQ | Blood Relation | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | In a certain code,  J @ K means J is K's daughter. J % ... |
| `cms5oxbyk006gebnmi7yxoqmo` | MCQ | Blood Relation | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | 1. If A + B means A is the WIFE of B 2. If A – B means ... |
| `cms5oxc08006iebnmqhktje3l` | MCQ | Blood Relation | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | Sohan and Saurabh are brothers.  Tanya and Tashima are ... |
| `cms5p505x007qebnmf0d22hzu` | MCQ | Statements and Conclusion | HARD | **INVALID** | mcq_data.correctAnswer is missing or empty | Statement:  From the last few years people are investin... |
| `cms5p505w007oebnmb1aeymh1` | MCQ | Salary Ratio | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | Statement:  Despite the hostel warnings, the student wa... |
| `cms5p511l0081ebnm2z44dg0z` | MCQ | Statements and Conclusion | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | Statement:  Many social-media celebrities advertise abo... |
| `cms5p9sc1008qebnmdcfxczex` | MCQ | Ages | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | 20 years ago Mohita was 22 years old. How old was she X... |
| `cms5ph5jz0094ebnmymgtqxir` | MCQ | Blood Relation | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | Question:  Data regarding the relations in a family is ... |
| `cms5ph5k00096ebnmgcq5527o` | MCQ | Blood Relation | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | Question:  Let p be the total number of males and q be ... |
| `cms5pqlgw009webnm0o6vg1k0` | MCQ | Statements and Conclusion | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | Question:  What is the code for "pretty" in the code la... |
| `cms5pqlh1009yebnmaiw0ehnc` | MCQ | Statements and Conclusion | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | Statement:  During a national emergency, even civilians... |
| `cms5pqlh500a0ebnmmrpw1628` | MCQ | Statements and Conclusion | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | Question:  A businessman divided an amount of 229 among... |
| `cms5pqljo00a2ebnm7zie5a6n` | MCQ | Statements and Conclusion | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | Statement:  "We need to recruit more skilled and qualif... |
| `cms5q1b5d00b9ebnm566y56ep` | MCQ | Salary Ratio | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | Question:  What is the height of triangle ABC?  Stateme... |
| `cms5q1c1e00blebnmzgrsspus` | MCQ | Statements and Conclusion | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | Question:  What is the color of human blood?  Statement... |
| `cms5q1c1h00bnebnmfg83b1qx` | MCQ | Blood Relation | MEDIUM | **INVALID** | Column 'answer' does not match 'mcq_data.correctAnswer' | Question:  How is A related to C?  Statements:  I. A is... |
| `cms5q1c3h00bpebnmhpzb3111` | MCQ | Statements and Conclusion | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | Statements:  All taps are mats.  All cats are rats.  Al... |
| `cms5q1c3j00brebnmvrdjss61` | MCQ | Reasoning Ability | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | Question:  Eight people P, Q, R, S, T, U, V and W were ... |
| `cms5q1c4100btebnmkujsx702` | MCQ | Statements and Conclusion | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | Statements:  Some drills are drugs.  No drug is a dam. ... |
| `cms5q1c4400bvebnmqt0nu2i8` | MCQ | Statements and Conclusion | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | Statement:  10 minutes of Surya Namaskar daily is highl... |
| `cms5q4sof00dsebnmpa5tcas5` | MCQ | Percentages | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | The sales price of a drilling machine was increased by ... |
| `cmsd3b4hg000zycdcyvdx8m9y` | MCQ | Fill In The Blanks | EASY | **INVALID** | mcq_data.correctAnswer is missing or empty | You must refrain ______ making noise during the lecture... |
| `cmsd3b7op0002ck80zikelq2f` | MCQ | Fill In The Blanks | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | Due to unforeseen circumstances, the meeting was ______... |
| `cmsd3bf3g000bck80b8w2xbht` | MCQ | Fill In The Blanks | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | He could not prevent his son ______ joining the expedit... |
| `cmscwf3nl001y4w72i66ib84r` | MCQ | Fill In The Blanks | HARD | **INVALID** | mcq_data.correctAnswer is missing or empty | The judge dismissed the lawsuit, characterizing the pla... |
| `cmscwefc0001p4w72q1nrb6wn` | MCQ | Fill In The Blanks | HARD | **INVALID** | mcq_data.correctAnswer is missing or empty | The ancient artifact was so fragile that even the sligh... |
| `cmscwdyx1001j4w72bfi8apfs` | MCQ | Fill In The Blanks | HARD | **INVALID** | mcq_data.correctAnswer is missing or empty | The diplomat handled the delicate international negotia... |
| `cmsd3covj001kycdcpl15aqln` | MCQ | Fill In The Blanks | EASY | **INVALID** | mcq_data.correctAnswer is missing or empty | Bread and butter ______ his favorite breakfast every mo... |
| `cmsd3c6qy0018ck809hd6q4i5` | MCQ | Fill In The Blanks | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | The government has agreed to ______ a committee to inve... |
| `cmsd3c18o0012ck80bamlsn4r` | MCQ | Fill In The Blanks | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | Although he was exhausted, he insisted on ______ his re... |
| `cmsd3c45e0015ck808zppszdg` | MCQ | Fill In The Blanks | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | Notwithstanding the heavy rains, the outdoor rally proc... |
| `cmsd3dv2d001zycdccpwy2qyt` | MCQ | Fill In The Blanks | EASY | **INVALID** | mcq_data.correctAnswer is missing or empty | Neither he nor his friends ______ present at the venue ... |
| `cmsd3bsoc0018ycdcfon28eo4` | MCQ | Fill In The Blanks | EASY | **INVALID** | mcq_data.correctAnswer is missing or empty | The Sun ______ in the east and sets in the west.... |
| `cmsd3bkkf0015ycdc6r2vrd7x` | MCQ | Fill In The Blanks | EASY | **INVALID** | mcq_data.correctAnswer is missing or empty | An honest man is the ______ gift of God to humanity.... |
| `cmsd3bh17000eck80q733bw8n` | MCQ | Fill In The Blanks | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | The witness's testimony was ______ with the physical ev... |
| `cmsd3bcgm0012ycdc8auag9ee` | MCQ | Fill In The Blanks | EASY | **INVALID** | mcq_data.correctAnswer is missing or empty | If I ______ a king, I would help all the poor people.... |
| `cmsd3eb700025ycdc8g3wboyq` | MCQ | Fill In The Blanks | EASY | **INVALID** | mcq_data.correctAnswer is missing or empty | He is proficient ______ speaking both English and Frenc... |
| `cmscwe76h001m4w72941esmbd` | MCQ | Fill In The Blanks | HARD | **INVALID** | mcq_data.correctAnswer is missing or empty | The CEO's commentary was far too ______; it raised more... |
| `cmsd3dmxn001wycdctkrna46v` | MCQ | Fill In The Blanks | EASY | **INVALID** | mcq_data.correctAnswer is missing or empty | The doctor advised him to give ______ smoking immediate... |
| `cmsd3cya3001nycdc0xbbaium` | MCQ | Fill In The Blanks | EASY | **INVALID** | mcq_data.correctAnswer is missing or empty | She has been working in this school ______ 2018.... |
| `cmsd3cguw001hycdce1jff4rc` | MCQ | Fill In The Blanks | EASY | **INVALID** | mcq_data.correctAnswer is missing or empty | The boys were accused ______ stealing apples from the o... |
| `cmscwevht001v4w72mbf6jeoj` | MCQ | Fill In The Blanks | HARD | **INVALID** | mcq_data.correctAnswer is missing or empty | He maintained an attitude of stoic ______ even when fac... |
| `cmscwenc7001s4w72xrcfl1bq` | MCQ | Fill In The Blanks | HARD | **INVALID** | mcq_data.correctAnswer is missing or empty | The leader's speech was designed to ______ panic among ... |
| `cmscwggae002g4w72d39pijp9` | MCQ | Fill In The Blanks | HARD | **INVALID** | mcq_data.correctAnswer is missing or empty | Her scholarly thesis was praised for its ______ researc... |
| `cmscwdqwl001g4w72cvvihxcb` | MCQ | Fill In The Blanks | HARD | **INVALID** | mcq_data.correctAnswer is missing or empty | Far from being a temporary setback, the financial loss ... |
| `cmscwgog0002j4w72lwh2t4zg` | MCQ | Fill In The Blanks | HARD | **INVALID** | mcq_data.correctAnswer is missing or empty | Although the manuscript was historically significant, i... |
| `cmse5gif5000b6i2yhsiabbfn` | MCQ | Error Identification | HARD | **INVALID** | mcq_data.correctAnswer is missing or empty | The scholars, whose research papers were published rece... |
| `cmse5ihpa000o135p7ndkekac` | MCQ | Error Identification | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | He discussed about the new project during the morning m... |
| `cmse5i9iw000l135plcnybglz` | MCQ | Error Identification | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | The manager insisted on him signing the document immedi... |
| `cmse5j61x000x135pjljrlprb` | MCQ | Error Identification | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | Supposing if it rains, what will we do for the outdoor ... |
| `cmse5jm9v0013135pclm87vur` | MCQ | Error Identification | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | The price of all these items have risen drastically ove... |
| `cmse5hl85000c135p6nxwlbef` | MCQ | Error Identification | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | The committee have submitted its report to the governme... |
| `cmse5htdf000f135pqhv8q9xx` | MCQ | Error Identification | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | Unless you do not try, you will never know what you can... |
| `cmse5hd2q0009135p1b4uh29b` | MCQ | Error Identification | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | One of the reasons why he failed were his lack of prepa... |
| `cmse5h10u000z6i2ynlb7ka5g` | MCQ | Error Identification | HARD | **INVALID** | mcq_data.correctAnswer is missing or empty | The mayor's decision, as well as those of his advisors,... |
| `cmse5kakn001c135pxr28a0j3` | MCQ | Error Identification | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | The director, along with the actors, were present at th... |
| `cmse5h3ao00126i2y3d2xrlc3` | MCQ | Error Identification | HARD | **INVALID** | mcq_data.correctAnswer is missing or empty | Not only the CEO but also the board members was surpris... |
| `cmsk7pmzd0017srmmq68dh826` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | How many times does a component re-render in React when... |
| `cmsk7qcvg001xsrmm6dfs4iwp` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the correct approach to trigger a re-render in ... |
| `cmsk7r0cz002esrmmhekhsov9` | MCQ | Fullstack Software Engineering 2026 | HARD | **INVALID** | mcq_data.correctAnswer is missing or empty | How does the state in a React application trigger a re-... |
| `cmsk7trw3004psrmmmqg65vab` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | The pre-rendered question statement is: "What is the re... |
| `cmsk7uigr0056srmm5ka4scte` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | In React, which of the following actions will trigger a... |
| `cmsk7vdgt005nsrmmdl63cu9h` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | In a React application, when a state variable is update... |
| `cmsk9o3dc0013cyrrzpmx8ox7` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the correct way to trigger a state re-render in... |
| `cmsk9pwmo001tcyrrmy5rrx46` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the correct way to trigger a re-render in a Rea... |
| `cmsk9rni4002acyrryak73tny` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | In a React application, which of the following actions ... |
| `cmsmqqhj8000452ot4be67cgn` | MCQ | Reciprocal | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the value of the reciprocal of (123+ 13-103 / 6... |
| `cmsmqqipa000b52otxxanh1kg` | MCQ | Reciprocal | EASY | **INVALID** | mcq_data.correctAnswer is missing or empty | The reciprocal of a fraction is more than itself by 21/... |
| `cmsn0p40g001zoaorm1c3y2jf` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | Mock question about CONCEPT_REACT_FRONTEND at MEDIUM le... |
| `cmsn0pwdk002poaorptxmgovf` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | Mock question about CONCEPT_REACT_FRONTEND at MEDIUM le... |
| `cmsn0qkfx0036oaoris0p8lc1` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | Mock question about CONCEPT_REACT_FRONTEND at MEDIUM le... |
| `cmsn0reat0040oaork5ho4d57` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | Mock question about CONCEPT_REACT_FRONTEND at MEDIUM le... |
| `cmsn0ry5k004hoaor7hm3tibc` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | Mock question about CONCEPT_REACT_FRONTEND at MEDIUM le... |
| `cmsn0sjku004yoaortvmfmcue` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | Mock question about CONCEPT_REACT_FRONTEND at MEDIUM le... |
| `cmsn4mz4l0025pz7lyfpslroo` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What will trigger a re-render in a React component?... |
| `cmsn4nvms0032pz7ljb4g9zwx` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the state value that triggers a re-render in a ... |
| `cmsn4o5lk003jpz7loevvojv1` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | In a React application, what is the primary reason that... |
| `cmsn4ofci0040pz7lexzccjd0` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the output of the following React component if ... |
| `cmsn4oo38004hpz7lvrasxxij` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the expected output of a React component when i... |
| `cmsn4p6q8004ypz7l25vyhlzp` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the trigger for a React component to re-render,... |
| `cmsn4pkpl005hpz7lbimxqya5` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the correct way to handle state updates in a Re... |
| `cmsn4pt4w005ypz7l0pof3hgl` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | In a React application, when a component's state is upd... |
| `cmsn4qddp006fpz7lmj1joahu` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | In a React application, what triggers a component to re... |
| `cmsn4qo1m006wpz7ldxiv9rip` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | How does a change in state in a React component trigger... |
| `cmsn50bl1000x10c4221fqlva` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | Mock question about CONCEPT_REACT_FRONTEND at MEDIUM le... |
| `cmsn55ddq00b4pz7leb9ouj4o` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the output of a React component when its state ... |
| `cmsn5idx400f7pz7l9qq3b6um` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | How does the React state trigger a re-render in the com... |
| `cmsn5j7j600fxpz7l3cx4b570` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the value of the state variable after it is upd... |
| `cmsn5jv1x00gupz7l1g6y0um0` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What will trigger a re-render in a React component when... |
| `cmsn5k2yi00hbpz7l2t2wzs01` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | When a React component's state changes, what triggers a... |
| `cmsn5kg5c00hupz7lwm3esilj` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the result of a state change in a React compone... |
| `cmsn5l4co00ibpz7lvydhjnw7` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | In a React application, what triggers a re-render of a ... |
| `cmsn5lehx00ispz7lc31humc9` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the correct way to manage state in a React comp... |
| `cmsn5lngy00j9pz7lvk7fijyq` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the value of the state variable after the re-re... |
| `cmsn5luz300jqpz7lg9v95u22` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the correct method to trigger a state re-render... |
| `cmsn5lwlm00k2pz7lfw0g5uyc` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the correct approach to trigger a re-render in ... |
| `cmsn5mhdq00kzpz7lse96gtdx` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | How does a React component determine if it needs to re-... |
| `cmsogtz020013rudpu31egcyv` | MCQ | Para Jumbled | HARD | **INVALID** | mcq_data.correctAnswer is missing or empty | Given below is a paragraph with five sentences, which a... |
| `cmsogtz0e0015rudpewocemaw` | MCQ | Para Jumbled | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | Topic: Ocean Pollution 1.Microplastics have been found ... |
| `cmsogtz0e0017rudpn2wd8hgr` | MCQ | Para Jumbled | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | Topic: Urban Heat Islands 1.Concrete and asphalt absorb... |
| `cmsogtz520019rudp78t9fq8m` | MCQ | Para Jumbled | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | Topic: Reading Habits 1.Studies show that people who re... |
| `cmsogtz52001brudp0xnakzu8` | MCQ | Para Jumbled | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | The following sentences form a coherent paragraph but a... |
| `cmsogz6x6002srudpgcko29h4` | MCQ | Grammar | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | Parts of the given sentence have been given as options.... |
| `cmsohfgox003drudplwbm9lh5` | MCQ | Vocabulary | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | Identify the ODD word: Loquacious, Garrulous, Verbose, ... |
| `cmsohfhf3003lrudpe6xe33b7` | MCQ | Vocabulary | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | In the sentence — "The judge's impartial verdict was pr... |
| `cmsohfhfr003nrudpfhz63x1p` | MCQ | Vocabulary | HARD | **INVALID** | mcq_data.correctAnswer is missing or empty | The scientist's __________ research eventually led to a... |
| `cmsohiizw004grudpon3cvb5y` | MCQ | Vocabulary | EASY | **INVALID** | mcq_data.correctAnswer is missing or empty | The intern showed __________ potential and was offered ... |
| `cmspq5wu9002k138cvcchu229` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the value of the state variable after it has be... |
| `cmspqm7e5001988kwt5k9la86` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the output of the following code snippet when t... |
| `cmspqmn96001q88kw1icyok6b` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | How many times will a component re-render in React if i... |
| `cmspqmxe6002788kwd3mk4l8y` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the value of the state that triggers a re-rende... |
| `cmspqom2g003488kw9svbc90y` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | How does a change in state affect the rendering of a Re... |
| `cmspqu8hq006g88kwk960ts4g` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | How does a state update in a React component trigger a ... |
| `cmspqx5mb007788kwlf9umz08` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What will be the result of a state update in a React co... |
| `cmspqyouo008788kwc3je6k4j` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What triggers a re-render in a React component?... |
| `cmspr0rpy008y88kwonn9vef1` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | How does React determine when to re-render a component?... |
| `cmsprnk4o002u9zkrnd3gskvy` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the value of x when the equation 3x + 5 = 20 is... |
| `cmspro6kq003b9zkrydhdh6jn` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | How does the state change in a React component trigger ... |
| `cmsprot87003s9zkrlgehus8i` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | How many times will a React component re-render if the ... |
| `cmsr6dywz00ko9ktivp6swwul` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What causes a React component to re-render?... |
| `cmsr6fxhe00l79ktixles6jzy` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | How many times will a React component re-render if its ... |
| `cmsr6hx2u00m89ktizqp5zboa` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the output of the following React component whe... |
| `cmsr6myo200nd9ktipy5r6aev` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the expected behavior of a React component when... |
| `cmsr6ozas00o59ktig5u84gzf` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the correct value for the React state update th... |
| `cmsr6r7vx00or9ktiqtd4d2l2` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the correct approach to handling state updates ... |
| `cmsr6t61900p89kti97lit003` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the primary method that triggers a component re... |
| `cmsr6tsmb00pp9ktifyfndt0y` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the value of the state variable after the re-re... |
| `cmsr6ufrq00q69kti4fottitx` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the correct value that triggers a re-render in ... |
| `cmsr6wcfb00qs9ktil2dqhcb1` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | How many times will a React component re-render when it... |
| `cmsr6zqer00sk9ktiwd6f2bcj` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the correct way to trigger a re-render in React... |
| `cmsr70dwl00t19kti02wlkj46` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | In a React application, what causes a component to re-r... |
| `cmsr72qt300u89ktimjmxo6zm` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | How many times will a React component re-render if its ... |
| `cmsr77qmv00v69kti6c1le4y8` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the output of a React component when its state ... |
| `cmsr78iw900vo9kti1i38pg73` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the value of the state that triggers a re-rende... |
| `cmsr7aozg00w79ktirzvzq3vy` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the value of the state variable that causes a R... |
| `cmsr7bcrz00wo9kti75yqb7ls` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | How does React determine when to re-render a component ... |
| `cmssi73zp001h10xn1kn1r87u` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the correct value for the computed result in th... |
| `cmssi7r18001y10xnvtw8lwqi` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the expected output of a React component when t... |
| `cmssi9t32002h10xnqz8a1izv` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | In a React application, when is the state of a componen... |
| `cmssiafo8002y10xn2nu0baw3` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the value of the state variable after a re-rend... |
| `cmssidzcb003s10xnrr920lrl` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | How does the state re-render trigger in React impact th... |
| `cmssifr5f004e10xn6dx5srjw` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | How many times does the component re-render if the stat... |
| `cmssiiboe004v10xnrp8mxd4s` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | Given the current state of a React component, what trig... |
| `cmssit0cj008e10xnupx1xaz1` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the output of a React component when its state ... |
| `cmssiuzpj008v10xnhkge824q` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the correct value that triggers a re-render in ... |
| `cmssix9x4009j10xnc2sqxotv` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the main reason for React components to re-rend... |
| `cmssixwsf00a010xn6ii9rs7u` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the impact of changing the state in a React com... |
| `cmssizpiy00ah10xnaj40z79y` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | How does the React state re-render trigger in a compone... |
| `cmssj0mhr00b010xnwurzanof` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | How does React determine whether to re-render a compone... |
| `cmssj2kw700bm10xn75ohkdkz` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | How does the state re-rendering mechanism in React affe... |
| `cmssj385o00c310xn9eh6vfgh` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the correct value to trigger a re-render in Rea... |
| `cmssj513c00ck10xnb8glpama` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the correct understanding of how React manages ... |
| `cmssj5nee00d110xn0c83o326` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | In a React application, which event causes a component ... |
| `cmssj69l100di10xnsz1r5ysf` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the correct value for the state re-render trigg... |
| `cmswtz209002lsl2v38hdn00k` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the result of the expression 5 * (3 + 2) - 4?... |
| `cmswu0mz3003fsl2v9rcneh25` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the correct mechanism by which React triggers a... |
| `cmswu19tu0045sl2vhs4f300r` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | How does the state update in React trigger a re-render ... |
| `cmswu4orq005hsl2vl9pxzkyy` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the value of the state variable when it is incr... |
| `cmswu5c2y0066sl2v8zppu78u` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the correct way to trigger a re-render in React... |
| `cmswu80ki006xsl2vuht3ris4` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the total number of times a React component re-... |
| `cmswu9ibx007usl2vpdcnzv28` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the correct approach to optimize React componen... |
| `cmswub4s60093sl2v6donbe3m` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | In a React application, which state change will trigger... |
| `cmswucp3b00a1sl2v9yi9rv0g` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | The pre-rendered question statement is: ""... |
| `cmswuep0a00b1sl2vdbs5gbil` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | How does the React state trigger a re-render of a compo... |
| `cmswufbw000bmsl2v767k2ahf` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | How many times will a React component re-render if the ... |
| `cmswujv9900dgsl2vkrtbxxwh` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the correct value of the state after triggering... |
| `cmswulnnc00exsl2vj7ebx1k4` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the total number of re-renders triggered in a R... |
| `cmswunbyw00ghsl2v4e7k22oi` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the total number of re-renders that occur when ... |
| `cmswunydq00h4sl2vn6onzn5x` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the expected result when a state variable in a ... |
| `cmswuqr0w00j6sl2vn5y4h1g6` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | How does the React State trigger a re-render when its v... |
| `cmswusv5o00k1sl2vsbwhco25` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the value of the state variable in a React comp... |
| `cmswutip500kmsl2vvntkrhq7` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | How does the state of a React component trigger a re-re... |
| `cmswuxhb700n5sl2vszuzuxwz` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | How many times will the component re-render if the stat... |
| `cmswuy3k700nqsl2vcntbovrb` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | In a React application, what triggers a re-render when ... |
| `cmswuypm500o9sl2vt1qp3ar0` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What will be the output of a React component when its s... |
| `cmswv0qlx00pwsl2vfja3jow9` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the expected output when the state of a React c... |
| `cmswv4nb700rgsl2vqzpf986r` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the total number of re-renders in a React compo... |
| `cmswv5db700s1sl2vb6ly1pvw` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What will trigger a re-render in a React component? Sel... |
| `cmswv762h00swsl2vwcldcsdd` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the result of the following React state update ... |
| `cmswv7su000thsl2vcsrdt2r4` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | How does React determine when to re-render components b... |
| `cmsx3yxnk0076npujn259bh0x` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the output of the following React code if the s... |
| `cmsx44tno00banpuj6x6yqh0r` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What value does a React component re-render when its st... |
| `cmsx45yd100cjnpujevsan4qs` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the correct value to trigger a re-render in a R... |
| `cmsx46ya900dbnpuj6oo8md0x` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the correct method to trigger a React component... |
| `cmsx479o200f3npujqra6l5b5` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | How does the state of a component in React trigger a re... |
| `cmsx47wls00fpnpujjrqohfwr` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | Compute the exact answer from the provided variables an... |
| `cmsx486j500g6npujgvqikcan` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | When using React, what triggers a re-render of a compon... |
| `cmsx488it00ginpuj3vsvw5uj` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | In a React application, which of the following scenario... |
| `cmsx48e0u00h4npujof65p1vh` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the expected behavior of React components in re... |
| `cmsx48fr900hgnpujr9jbofgi` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the value of the state variable after a re-rend... |
| `cmsx48ux900i2npujh8t2ft7d` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the output of the following React component whe... |
| `cmsx49eu400innpuj7bopy68x` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the value returned by a component when its stat... |
| `cmsx4aqmt00kunpuju96q5fo7` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the result of the following calculation: 5 + 7 ... |
| `cmsx4ayp500lmnpujy7xvas5r` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | How many times does React re-render a component when it... |
| `cmsx4bi0m00manpujq5pg3t5x` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the value of the state variable when a componen... |
| `cmsx4bty800mrnpujfv3p8m9m` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the output of the React component after state h... |
| `cmsx4bvpq00mznpujwrv9mno5` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | The pre-rendered question statement is: "How many times... |
| `cmsx4csf400qlnpujimti5xvw` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the value of the variable that causes a re-rend... |
| `cmsx4d5h300r4npujy99m212l` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What value will trigger a re-render in a React componen... |
| `cmsx4ddep00rqnpujmu786kni` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | The component re-renders when the state changes. What i... |
| `cmsx4dnzh00s7npujkslnj09a` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | How many times will the component re-render if the stat... |
| `cmsx4dwkn00spnpujn00kjog1` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | In a React application, when a state is updated, which ... |
| `cmsx4dwyh00sunpuji2njtbmz` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the primary condition that triggers a re-render... |
| `cmsx4ek7b00udnpujolrme8x8` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the correct value for the trigger that causes a... |
| `cmsx4erse00uznpuj1prka65m` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | In React, what triggers a state re-render when using th... |
| `cmsx4i0ai011tnpuj0icqq8bd` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | How many times will a React component re-render when it... |
| `cmsx4ii2d012jnpujl7kvgjzy` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the output of the React component when the stat... |
| `cmsx4iqwj0130npuj2qnez1bn` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the effect of changing the state in a React com... |
| `cmsx5aj7100m0huhacx2fzjhp` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the value of the state variable after triggerin... |
| `cmsx66pid00cctjk0vqmf1iv9` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the output of the following React component whe... |
| `cmsx670dp00cttjk0ixip1y2c` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the exact answer to the expression 5 + 3 × 2?... |
| `cmsx67fxc00datjk0avtga4p0` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | How many times will a React component re-render if its ... |
| `cmsx67o4n00drtjk0pq9kxn7t` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | The pre-rendered question statement is: "How many times... |
| `cmsx67wk300e8tjk0yfx9y9qu` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | How does the React state trigger a re-render in a funct... |
| `cmsx68rpy00eptjk0r85wnvs7` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | When does React state re-render a component?... |
| `cmsy726d400195ll775t4u05n` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the correct way to trigger a state re-render in... |
| `cmsy78bib00di5ll7lwn1npfz` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | How does React determine if a component should re-rende... |
| `cmsyckx6k00amrpre4wsaituy` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the value of the state variable after a re-rend... |
| `cmsycmm5700b5rpre4vfzs93u` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the state re-render trigger in React when a com... |
| `cmsycq11k00bvrprebkwwvaiy` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the value of the state variable in a React comp... |
| `cmsycrzhy00ehrprez5xtpg60` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the expected output of a React component when i... |
| `cmsycus4100furpretgno104y` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the output of a React component when the state ... |
| `cmsyd308t00jvrpreg3yzdbvq` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | How many times will a React component re-render if its ... |
| `cmsyd936j00mcrprel5tvwi3y` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the value of the state variable after the re-re... |
| `cmsydb1fp00o4rpre1f9qaug1` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | How does state management in React trigger a re-render ... |
| `cmsyded2t00ourpreqwahhj3l` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What value will trigger a re-render in React when the s... |
| `cmsydg2z500pdrpre43jiyl2c` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the value of the state variable that will trigg... |
| `cmsydhw1200pzrpre1e5jw96g` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | When a state is updated in a React component, what trig... |
| `cmsydhwhy00q4rpreys1xt8dy` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the number of re-renders triggered by state upd... |
| `cmsydjr2d00r1rpre20vyjju5` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the correct approach to determine if a React co... |
| `cmszzokzq00ow10zyu8z07zfd` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the value returned when the state in a React co... |
| `cmszzq3ob00pi10zypf8c7wo3` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the primary reason for a component to re-render... |
| `cmszzq3yr00pl10zyuciwyb3e` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | When a React component's state is updated, what trigger... |
| `cmszzq46r00pp10zy95f8sm9e` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | How does changing the state in a React component affect... |
| `cmt11b9fm000c79b4oeo46hjc` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What value is returned when a React component's state i... |
| `cmt11cvxw000v79b4scoaz38a` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | How does the state update in React affect component re-... |
| `cmt11cw1f000x79b4347m059k` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the output of the React component when the stat... |
| `cmt11elud001z79b4xwsw21f6` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the output when a component's state is updated ... |
| `cmt11emd5002479b4no58ngs0` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What will trigger a re-render in a React component when... |
| `cmt11g5bl002y79b4k3yf2gff` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the correct value of the state variable after a... |
| `cmt11g5cd003079b4fsht5utu` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | How many times will a React component re-render if its ... |
| `cmt11im5y003w79b48jz872hg` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What will happen to the component's state and re-render... |
| `cmt11k463004d79b4ns8ltzeh` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the output of the following React component aft... |
| `cmt11orlp008c79b43fgwy5js` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the expected value when a React component's sta... |
| `cmt11os6i008h79b47vj65t4y` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the value of the state variable after a re-rend... |
| `cmt11vzad00f179b4y928ii7w` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | When updating the state in a React component, which of ... |
| `cmt11w00h00f879b4hewe4u7c` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | In a React application, what is the primary reason for ... |
| `cmt11y9km00ke79b4t562vfxx` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | How many times will a React component re-render if the ... |
| `cmt1206ei00nv79b45ai1w8ui` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | How does updating the state in a React component trigge... |
| `cmt1206l400nx79b4s3yydqzk` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the expected output when a state is updated in ... |
| `cmt1248hz00s679b4cliolwaq` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the correct way to trigger a re-render in a Rea... |
| `cmt1260dx00ta79b46a0n41qz` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | How does changing the state in a React component affect... |
| `cmt12a58l00vc79b4s8d2vwin` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the value of the state variable after a re-rend... |
| `cmt12bp6100vw79b4motpedwn` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the output of the following React component whe... |
| `cmt12bprp00w379b41zx3g0i0` | MCQ | CONCEPT_REACT_FRONTEND | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What will trigger a re-render in React when using state... |
| `cmt3x0auy0034nhc34gzvdad6` | MCQ | Sentence Correction | EASY | **INVALID** | Explanation describes unrelated question ('going to the gym' | Identify the grammatically correct sentence.... |
| `cmt3x0hiw0036nhc3yp0ik46o` | MCQ | Sentence Correction | EASY | **INVALID** | Explanation describes unrelated question ('She is an enginee | Select the grammatically correct sentence from the opti... |
| `cmt3x2ot7003qnhc3rwnyjfn5` | MCQ | Sentence Correction | EASY | **INVALID** | Explanation describes unrelated question ('She enjoys readin | Identify the sentence that is grammatically correct.... |
| `cmt40ruwj00167gggz3al39ww` | MCQ | Sentence Correction | HARD | **INVALID** | Explanation describes unrelated question ('Neither the manag | Select the grammatically correct sentence from the foll... |
| `cmt46kzv60001zdnocjjcu8kf` | CODING | Basic Programming | EASY | **INVALID** | No test cases found in coding_data | ### Problem Statement Given two integers `a` and `b`, c... |
| `cmt4819ok0003zdnovj2fh0m5` | CODING | Loop | EASY | **INVALID** | No test cases found in coding_data | ### Problem Statement Given an integer `n` and limit `k... |
| `cmt4b9sfc000512jwhvt4iuo4` | CODING | Simulation | EASY | **INVALID** | No test cases found in coding_data | ### Problem Statement Given a 1D binary state array `ce... |
| `cmt4bfgty0001zju6mm2mesvl` | CODING | Coding | EASY | **INVALID** | No test cases found in coding_data | ### Problem Statement  You are given an array of intege... |
| `cmt4bg2wz0003zju60mjm50be` | CODING | Coding | EASY | **INVALID** | No test cases found in coding_data | ### Problem Statement You are tasked with creating a si... |
| `cmt4bg4230005zju6bpfhw4oa` | CODING | Coding | MEDIUM | **INVALID** | No test cases found in coding_data | ### Problem Statement You are given an array of integer... |
| `cmt4bg6x60007zju6d3ylnf05` | CODING | Basic Programming | EASY | **INVALID** | No test cases found in coding_data | ### Problem Statement Given total marks obtained and to... |
| `cmt4bgczx0009zju67acgpqq6` | CODING | Basic Programming | EASY | **INVALID** | No test cases found in coding_data | ### Problem Statement Given a user's name and age, retu... |
| `cmt4bgfpr000bzju610hjqddl` | CODING | Basic Programming | EASY | **INVALID** | No test cases found in coding_data | ### Problem Statement Given two positive integers `divi... |
| `cmt4bggt8000dzju6tz53k9sp` | CODING | Basic Programming | EASY | **INVALID** | No test cases found in coding_data | ### Problem Statement Given a student's numerical score... |
| `cmt4bgn6s000fzju63untxp9j` | CODING | Basic Programming | MEDIUM | **INVALID** | No test cases found in coding_data | ### Problem Statement Implement a step accumulator func... |
| `cmt4bgpif000hzju60biev0in` | CODING | Array | EASY | **INVALID** | No test cases found in coding_data | ### Problem Statement Given an array of integers `nums`... |
| `cmt4bgqtl000jzju6rzqjp0na` | CODING | Array | EASY | **INVALID** | No test cases found in coding_data | ### Problem Statement Given an array of integers `arr`,... |
| `cmt4bj5rx0001tcvtl13lpqv0` | CODING | Array | MEDIUM | **INVALID** | No test cases found in coding_data | ### Problem Statement Given a 1-indexed sorted array of... |
| `cmt4bj81f0003tcvtfi6jgahg` | CODING | Array | MEDIUM | **INVALID** | No test cases found in coding_data | ### Problem Statement Given an array of integers `nums`... |
| `cmt4bjdqu0005tcvt2l8bxf3t` | CODING | Array | MEDIUM | **INVALID** | No test cases found in coding_data | ### Problem Statement Given an integer array `nums`, co... |
| `cmt4bjegn0007tcvt6bgacwdd` | CODING | Array | MEDIUM | **INVALID** | No test cases found in coding_data | ### Problem Statement Given an integer array `nums`, fi... |
| `cmt4bjf550009tcvtky6dziqr` | CODING | Array | EASY | **INVALID** | No test cases found in coding_data | ### Problem Statement Given an integer array `nums`, ro... |
| `cmt4bjfrx000btcvt1er7y7x0` | CODING | String | EASY | **INVALID** | No test cases found in coding_data | ### Problem Statement Given an input string `s`, revers... |
| `cmt4bjgh0000dtcvt0bur8125` | CODING | String | EASY | **INVALID** | No test cases found in coding_data | ### Problem Statement Given a string `s`, compress cons... |
| `cmt4bjh6z000ftcvteykjzrzn` | CODING | String | EASY | **INVALID** | No test cases found in coding_data | ### Problem Statement Given two strings `s` and `t`, re... |
| `cmt4bjjtz000htcvtfrcquk7y` | CODING | String | MEDIUM | **INVALID** | No test cases found in coding_data | ### Problem Statement Given two strings `needle` and `h... |
| `cmt4bjl1k000jtcvtgb1p21qj` | CODING | String | MEDIUM | **INVALID** | No test cases found in coding_data | ### Problem Statement Given a string `s`, find the firs... |
| `cmt4bjlrz000ltcvt9i8yytzp` | CODING | String | MEDIUM | **INVALID** | No test cases found in coding_data | ### Problem Statement Given a string `queryIP`, return ... |
| `cmt4bjmhl000ntcvt0j6jc82h` | CODING | Math | EASY | **INVALID** | No test cases found in coding_data | ### Problem Statement Given an integer `x`, return `tru... |
| `cmt4bjn84000ptcvt7n9jl2n0` | CODING | Math | MEDIUM | **INVALID** | No test cases found in coding_data | ### Problem Statement Given an integer `n`, return the ... |
| `cmt4bjnxk000rtcvt5m1n8kav` | CODING | Math | EASY | **INVALID** | No test cases found in coding_data | ### Problem Statement Given two integers `a` and `b`, c... |
| `cmt4bjqqq000ttcvtbbt6qorl` | CODING | Math | MEDIUM | **INVALID** | No test cases found in coding_data | ### Problem Statement Given `n` and `r`, calculate the ... |
| `cmt4bjrva000vtcvtpuzasto2` | CODING | Math | MEDIUM | **INVALID** | No test cases found in coding_data | ### Problem Statement Implement fast power `pow(base, e... |
| `cmt4bjslj000xtcvte52t5i6d` | CODING | Math | MEDIUM | **INVALID** | No test cases found in coding_data | ### Problem Statement Given an integer `n`, return the ... |
| `cmt4bjtbe000ztcvtsi5ft0p3` | CODING | Matrix | MEDIUM | **INVALID** | No test cases found in coding_data | ### Problem Statement Given an `m x n` matrix of intege... |
| `cmt4bju280011tcvtvg4grsts` | CODING | Matrix | EASY | **INVALID** | No test cases found in coding_data | ### Problem Statement Given a square matrix `mat`, retu... |
| `cmt4bjv100013tcvtzpsm1km3` | CODING | Matrix | MEDIUM | **INVALID** | No test cases found in coding_data | ### Problem Statement Given an `n x n` 2D matrix repres... |
| `cmt4bk09n0015tcvt48pnc6wb` | CODING | Matrix | MEDIUM | **INVALID** | No test cases found in coding_data | ### Problem Statement Given an `m x n` matrix, return a... |
| `cmt4bk1gs0017tcvtu439jxy9` | CODING | Matrix | MEDIUM | **INVALID** | No test cases found in coding_data | ### Problem Statement Write an efficient algorithm that... |
| `cmt4bk23k0019tcvtrj205oht` | CODING | Matrix | HARD | **INVALID** | No test cases found in coding_data | ### Problem Statement Perform flood fill on an image re... |
| `cmt4bk3me001btcvtjfs2ps52` | CODING | Loop | EASY | **INVALID** | No test cases found in coding_data | ### Problem Statement Given a positive integer `n`, cal... |
| `cmt4bk4a4001dtcvtf6ijfp64` | CODING | Loop | EASY | **INVALID** | No test cases found in coding_data | ### Problem Statement Given integer `n`, generate the r... |
| `cmt4bk98y001ftcvt853mtdyp` | CODING | Loop | MEDIUM | **INVALID** | No test cases found in coding_data | ### Problem Statement Given an array of integers `nums`... |
| `cmt4bka9m001htcvtq1258s1u` | CODING | Loop | MEDIUM | **INVALID** | No test cases found in coding_data | ### Problem Statement Given an integer `n`, compute the... |
| `cmt4bkbiv001jtcvtkeeoihn4` | CODING | Logic | EASY | **INVALID** | No test cases found in coding_data | ### Problem Statement Given a year `year`, determine if... |
| `cmt4bkcsq001ltcvtf5yda3gq` | CODING | Logic | EASY | **INVALID** | No test cases found in coding_data | ### Problem Statement Given boolean values `p`, `q`, an... |
| `cmt4bkdi4001ntcvtrs9r8029` | CODING | Logic | MEDIUM | **INVALID** | No test cases found in coding_data | ### Problem Statement Given coordinates `(x, y)`, ident... |
| `cmt4bkehh001ptcvtwtptkhf8` | CODING | Logic | MEDIUM | **INVALID** | No test cases found in coding_data | ### Problem Statement Simulate a traffic light state ma... |
| `cmt4bkffo001rtcvtvgfggxcc` | CODING | Logic | MEDIUM | **INVALID** | No test cases found in coding_data | ### Problem Statement Given a non-empty array of intege... |
| `cmt4bkggn001ttcvtytkmrn8t` | CODING | Searching | EASY | **INVALID** | No test cases found in coding_data | ### Problem Statement Given an array `nums` and target ... |
| `cmt4bkh46001vtcvtiunwa3j6` | CODING | Searching | EASY | **INVALID** | No test cases found in coding_data | ### Problem Statement Given an array `arr` and `target`... |
| `cmt4bkjg5001xtcvta3489ouo` | CODING | Searching | EASY | **INVALID** | No test cases found in coding_data | ### Problem Statement Given a sorted array of integers ... |
| `cmt4bkkxn001ztcvtlmon4bfn` | CODING | Searching | MEDIUM | **INVALID** | No test cases found in coding_data | ### Problem Statement Given piles of bananas `piles` an... |
| `cmt4bklpd0021tcvt4r2v3rev` | CODING | Searching | HARD | **INVALID** | No test cases found in coding_data | ### Problem Statement Given a mountain array `arr`, ret... |
| `cmt4bkmg30023tcvtvqhaufk0` | CODING | Sorting | EASY | **INVALID** | No test cases found in coding_data | ### Problem Statement Given an array `nums` with `n` ob... |
| `cmt4bkneu0025tcvtpqz5390q` | CODING | Sorting | EASY | **INVALID** | No test cases found in coding_data | ### Problem Statement Given an array `arr`, sort it usi... |
| `cmt4bkozt0027tcvt5kzbxkfm` | CODING | Sorting | MEDIUM | **INVALID** | No test cases found in coding_data | ### Problem Statement Given two sorted integer arrays `... |
| `cmt4bkvfl0029tcvtgzsebc1b` | CODING | Sort | EASY | **INVALID** | No test cases found in coding_data | ### Problem Statement Given an integer array `nums`, mo... |
| `cmt4bkwez002btcvt2j8s8s4h` | CODING | Recursion | EASY | **INVALID** | No test cases found in coding_data | ### Problem Statement Given `n`, calculate F(n) where F... |
| `cmt4bkx5p002dtcvtnt48re42` | CODING | Recursion | EASY | **INVALID** | No test cases found in coding_data | ### Problem Statement Implement `myPow(x, n)` which cal... |
| `cmt4bkzb2002ftcvtbxsod884` | CODING | Recursion | HARD | **INVALID** | No test cases found in coding_data | ### Problem Statement Given an integer array `nums` of ... |
| `cmt4bl3su002htcvtt8su74nt` | CODING | Simulation | MEDIUM | **INVALID** | No test cases found in coding_data | ### Problem Statement Given initial balance and a list ... |
| `cmt4bl895002jtcvtpalg44lm` | CODING | Dynamic Programming | MEDIUM | **INVALID** | No test cases found in coding_data | ### Problem Statement You are climbing a staircase. It ... |
| `cmt4bl8xi002ltcvtad4rbgsl` | CODING | Dynamic Programming | MEDIUM | **INVALID** | No test cases found in coding_data | ### Problem Statement Given an array `nums` representin... |
| `cmt4blb19002ntcvts02c95co` | CODING | Dynamic Programming | MEDIUM | **INVALID** | No test cases found in coding_data | ### Problem Statement A robot is located at the top-lef... |
| `cmt4bldkc002ptcvt33a0m6s5` | CODING | Dynamic Programming | HARD | **INVALID** | No test cases found in coding_data | ### Problem Statement Given weights `wt`, values `val`,... |
| `cmt4blfxb002rtcvtc7zjawll` | CODING | Trees | EASY | **INVALID** | No test cases found in coding_data | ### Problem Statement Given the level-order representat... |
| `cmt4blhb8002ttcvtwtmecjva` | CODING | Trees | EASY | **INVALID** | No test cases found in coding_data | ### Problem Statement Given the root of a binary tree, ... |
| `cmt4bliji002vtcvt9x2e2d80` | CODING | Trees | MEDIUM | **INVALID** | No test cases found in coding_data | ### Problem Statement Given the root of a binary tree, ... |
| `cmt4blk9l002xtcvtmuic32lx` | CODING | Graphs | MEDIUM | **INVALID** | No test cases found in coding_data | ### Problem Statement Given an `m x n` 2D binary grid `... |
| `cmt4blkzu002ztcvtt572gkjo` | CODING | Graphs | MEDIUM | **INVALID** | No test cases found in coding_data | ### Problem Statement Given `n` nodes, an adjacency lis... |
| `cmt4bllt20031tcvtafhlsj6d` | CODING | General | EASY | **INVALID** | No test cases found in coding_data | ### Problem Statement Given an integer `n`, return a st... |
| `cmt4blqnc0033tcvtbqpmed95` | CODING | General | MEDIUM | **INVALID** | No test cases found in coding_data | ### Problem Statement Given an array of integers `nums`... |
| `cmt4bltwz0035tcvttgrz8gkd` | CODING | Sorting | MEDIUM | **INVALID** | No test cases found in coding_data | ### Problem Statement Implement QuickSort algorithm on ... |
| `cmt4bluzz0037tcvtyb7sm8hv` | CODING | Sorting | MEDIUM | **INVALID** | No test cases found in coding_data | ### Problem Statement Given an array `nums` containing ... |
| `cmt4blvt10039tcvtbmggcpe1` | CODING | Sorting | MEDIUM | **INVALID** | No test cases found in coding_data | ### Problem Statement Given an ordering string `order` ... |
| `cmt4blwi6003btcvto3oyep4b` | CODING | Sort | MEDIUM | **INVALID** | No test cases found in coding_data | ### Problem Statement Given an integer array `nums`, mo... |
| `cmt4bly4s003dtcvt6r4clq7r` | CODING | Sort | MEDIUM | **INVALID** | No test cases found in coding_data | ### Problem Statement Given an array `nums`, sort the a... |
| `cmt4bm05l003ftcvtgqgejrev` | CODING | Sort | MEDIUM | **INVALID** | No test cases found in coding_data | ### Problem Statement Given an integer array `nums` and... |
| `cmt4bm3zs003htcvtz9e8onkq` | CODING | Recursion | MEDIUM | **INVALID** | No test cases found in coding_data | ### Problem Statement Calculate factorial `n!` using ta... |
| `cmt4bpvzj00011wqy4rlfvhg2` | CODING | Recursion | MEDIUM | **INVALID** | No test cases found in coding_data | ### Problem Statement Compute the maximum contiguous su... |
| `cmt4bpxer00031wqyqsqrylj3` | CODING | Simulation | MEDIUM | **INVALID** | No test cases found in coding_data | ### Problem Statement Given a 3x3 board representation ... |
| `cmt4bpzl500051wqyum4y9h22` | CODING | Simulation | MEDIUM | **INVALID** | No test cases found in coding_data | ### Problem Statement Given commands ('G' move, 'L' tur... |
| `cmt4bq2k700071wqyu84g7nb3` | CODING | Simulation | HARD | **INVALID** | No test cases found in coding_data | ### Problem Statement Simulate a task queue with arriva... |
| `cmt4bq5vo00091wqyynyfa3xr` | CODING | Dynamic Programming | HARD | **INVALID** | No test cases found in coding_data | ### Problem Statement Given two strings `text1` and `te... |
| `cmt4bq6ou000b1wqy6lzqleen` | CODING | Dynamic Programming | HARD | **INVALID** | No test cases found in coding_data | ### Problem Statement Given `n` cities and a distance m... |
| `cmt4bq7h3000d1wqycbmhtmrt` | CODING | Trees | EASY | **INVALID** | No test cases found in coding_data | ### Problem Statement Given the root of a binary tree, ... |
| `cmt4bq86i000f1wqyzitwzplk` | CODING | Trees | MEDIUM | **INVALID** | No test cases found in coding_data | ### Problem Statement Given a binary tree and two nodes... |
| `cmt4bqag0000h1wqyj2htv6u3` | CODING | Trees | HARD | **INVALID** | No test cases found in coding_data | ### Problem Statement Given the root of a binary tree a... |
| `cmt4bqdcy000j1wqywu4trc66` | CODING | Graphs | EASY | **INVALID** | No test cases found in coding_data | ### Problem Statement Given `n` nodes and an edge list ... |
| `cmt4bqioz000l1wqy11p1vszf` | CODING | Graphs | MEDIUM | **INVALID** | No test cases found in coding_data | ### Problem Statement Given `n` nodes and list of undir... |
| `cmt4bqme1000n1wqymfhcre6p` | CODING | Graphs | HARD | **INVALID** | No test cases found in coding_data | ### Problem Statement Given `n` nodes and directed weig... |
| `cmt4bqn66000p1wqyhir5n79m` | CODING | Graphs | HARD | **INVALID** | No test cases found in coding_data | ### Problem Statement There are `numCourses` courses to... |
| `cmt4bqq6o000r1wqyhf53lfxz` | CODING | Graphs | HARD | **INVALID** | No test cases found in coding_data | ### Problem Statement Given array `points` where points... |
| `cmt4bqupz000t1wqyuozp6bby` | CODING | General | EASY | **INVALID** | No test cases found in coding_data | ### Problem Statement Given an array `nums` of size `n`... |
| `cmt4bqx1s000v1wqy4rig5mow` | CODING | General | MEDIUM | **INVALID** | No test cases found in coding_data | ### Problem Statement Given an integer `num`, convert i... |
| `cmt4br223000x1wqy78nbp4if` | CODING | General | MEDIUM | **INVALID** | No test cases found in coding_data | ### Problem Statement There are `n` gas stations along ... |
| `cmt72ak090002yndtcqe0brbe` | MCQ | Synonyms | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | Select the word that is most similar in meaning (SYNONY... |
| `cmt72ako80004yndtxjjqqzsz` | MCQ | Synonyms | EASY | **INVALID** | mcq_data.correctAnswer is missing or empty | Choose the synonym for the word "**CANDID**".... |
| `cmt72al1d0006yndtfn8vqejx` | MCQ | Synonyms | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the synonym of "**PRAGMATIC**"?... |
| `cmt72alhh0008yndtujwluxiw` | MCQ | Synonyms | EASY | **INVALID** | mcq_data.correctAnswer is missing or empty | Select the word that has the closest meaning to "**ABUN... |
| `cmt72aluu000ayndtbpdw03ak` | MCQ | Synonyms | HARD | **INVALID** | mcq_data.correctAnswer is missing or empty | Choose the word closest in meaning to "**ELOQUENT**".... |
| `cmt72ao7g000dyndtsl175j0l` | MCQ | Antonyms | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | Select the word that is most nearly OPPOSITE in meaning... |
| `cmt72aomc000fyndtycqic39x` | MCQ | Antonyms | EASY | **INVALID** | mcq_data.correctAnswer is missing or empty | Choose the antonym for the word "**METICULOUS**".... |
| `cmt72aoyr000hyndthw3jufjz` | MCQ | Antonyms | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the antonym of "**BENEVOLENT**"?... |
| `cmt72apd4000jyndts1ya9seg` | MCQ | Antonyms | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | Select the opposite of "**AMBIGUOUS**".... |
| `cmt72aqx7000lyndthg16t977` | MCQ | Antonyms | HARD | **INVALID** | mcq_data.correctAnswer is missing or empty | Choose the antonym of "**FRUGAL**".... |
| `cmt72asdf000nyndttlhtcd00` | MCQ | Sentence Completion | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | Complete the sentence with the most appropriate word:  ... |
| `cmt72asy0000pyndt9gai6qpl` | MCQ | Sentence Completion | EASY | **INVALID** | mcq_data.correctAnswer is missing or empty | Complete the sentence:  "Despite the heavy downpour, th... |
| `cmt72atid000ryndtvg7qjcm3` | MCQ | Sentence Completion | EASY | **INVALID** | mcq_data.correctAnswer is missing or empty | Complete the sentence:  "The CEO made a ________ speech... |
| `cmt72atxn000tyndtf2v2c8x7` | MCQ | Sentence Completion | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | Complete the sentence:  "Due to unforeseen technical di... |
| `cmt72auaz000vyndtaoa1vkeh` | MCQ | Sentence Completion | HARD | **INVALID** | mcq_data.correctAnswer is missing or empty | Complete the sentence:  "Her explanation was so _______... |
| `cmt72aw0x000xyndtcbmwa8zk` | MCQ | Cause & Effect | EASY | **INVALID** | mcq_data.correctAnswer is missing or empty | Read the two statements and choose the correct relation... |
| `cmt72awjh000zyndtq9k373gs` | MCQ | Cause & Effect | EASY | **INVALID** | mcq_data.correctAnswer is missing or empty | Read the two statements:  **Statement I:** Prices of pe... |
| `cmt72ax3l0011yndttqrb0w59` | MCQ | Cause & Effect | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | Read the statements:  **Statement I:** Majority of the ... |
| `cmt72axpi0013yndt8907yld6` | MCQ | Cause & Effect | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | Read the statements:  **Statement I:** A large number o... |
| `cmt72ayb10015yndtyri8mgsq` | MCQ | Cause & Effect | HARD | **INVALID** | mcq_data.correctAnswer is missing or empty | Read the statements:  **Statement I:** Air quality inde... |
| `cmt72b0b60017yndtszw79q02` | MCQ | Ranking & Ordering | EASY | **INVALID** | mcq_data.correctAnswer is missing or empty | In a class of 45 students, Rahul ranks 15th from the to... |
| `cmt72b0re0019yndt07oja1co` | MCQ | Ranking & Ordering | EASY | **INVALID** | mcq_data.correctAnswer is missing or empty | Priya ranks 8th from the left and 23rd from the right i... |
| `cmt72b19f001byndtonaq3ion` | MCQ | Ranking & Ordering | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | In an examination, A scored more than B but less than C... |
| `cmt72b1o9001dyndt8026qk0o` | MCQ | Ranking & Ordering | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | In a queue of 40 people, Aman is 12th from the front an... |
| `cmt72b2oo001fyndtirxx59tj` | MCQ | Ranking & Ordering | HARD | **INVALID** | mcq_data.correctAnswer is missing or empty | Five friends (P, Q, R, S, T) have different heights. Q ... |
| `cmt72b3v4001hyndtcgwnp4lb` | MCQ | Statement & Assumption | EASY | **INVALID** | mcq_data.correctAnswer is missing or empty | **Statement:** "Please switch off your mobile phones wh... |
| `cmt72b4ec001jyndtvrzyvurm` | MCQ | Statement & Assumption | EASY | **INVALID** | mcq_data.correctAnswer is missing or empty | **Statement:** "The municipal corporation advised resid... |
| `cmt72b4zm001lyndt3nquq32u` | MCQ | Statement & Assumption | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | **Statement:** "Join our 3-month coding bootcamp to tra... |
| `cmt72b6vu001nyndt18ayefbm` | MCQ | Statement & Assumption | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | **Statement:** "The management decided to offer annual ... |
| `cmt72b7i2001pyndtq8z468i9` | MCQ | Statement & Assumption | HARD | **INVALID** | mcq_data.correctAnswer is missing or empty | **Statement:** "Read the operating manual carefully bef... |
| `cmt72b8s6001ryndtrli5sp4y` | MCQ | Logical Deduction | EASY | **INVALID** | mcq_data.correctAnswer is missing or empty | **Statements:** 1. All mammals are warm-blooded. 2. All... |
| `cmt72b9dp001tyndtu7o6io1j` | MCQ | Logical Deduction | EASY | **INVALID** | mcq_data.correctAnswer is missing or empty | **Statements:** 1. If an employee completes 5 years of ... |
| `cmt72bav5001vyndt5grlk14v` | MCQ | Logical Deduction | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | **Statements:** 1. No plastic items are biodegradable. ... |
| `cmt72bbh8001xyndth1whj2fv` | MCQ | Logical Deduction | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | **Statements:** 1. All candidates who score above 85% q... |
| `cmt72bc04001zyndtvkqw1py6` | MCQ | Logical Deduction | HARD | **INVALID** | mcq_data.correctAnswer is missing or empty | **Statements:** 1. All squares are rectangles. 2. All r... |
| `cmt736cvi0001wm05284f5l9m` | MCQ | Profit & Loss | EASY | **INVALID** | mcq_data.correctAnswer is missing or empty | A trader buys an article for ₹800 and sells it for ₹100... |
| `cmt736dmw0003wm05ucwudvg4` | MCQ | Profit & Loss | EASY | **INVALID** | mcq_data.correctAnswer is missing or empty | A mobile phone bought for ₹15,000 is sold for ₹12,000. ... |
| `cmt736e210005wm05i5x1jwv8` | MCQ | Profit & Loss | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | An item with a marked price of ₹2000 is sold after two ... |
| `cmt736ei00007wm0527elpryh` | MCQ | Profit & Loss | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | A shopkeeper sells a watch for ₹2300, making a profit o... |
| `cmt736ev40009wm056p1ozmoe` | MCQ | Profit & Loss | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | A retailer marks his goods 40% above the cost price and... |
| `cmt736fcm000bwm05y5o8qbvl` | MCQ | Profit & Loss | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | By selling a bicycle for ₹4500, a merchant loses 10%. A... |
| `cmt736fq7000dwm05ay6ntj34` | MCQ | Profit & Loss | HARD | **INVALID** | mcq_data.correctAnswer is missing or empty | A dealer sells two television sets for ₹12,000 each. On... |
| `cmt736gvq000fwm05k1iz5xia` | MCQ | Profit & Loss | HARD | **INVALID** | mcq_data.correctAnswer is missing or empty | A dishonest grocer professes to sell his goods at cost ... |
| `cmt736ijr000hwm057cfgjspg` | MCQ | Profit & Loss | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | The ratio of cost price to marked price of a shirt is 5... |
| `cmt736jps000jwm05zn45cgpq` | MCQ | Profit & Loss | HARD | **INVALID** | mcq_data.correctAnswer is missing or empty | A single discount equivalent to three successive discou... |
| `cmt74h7it000112t9m8ezseg3` | MCQ | Time, Speed & Distance | EASY | **INVALID** | mcq_data.correctAnswer is missing or empty | An express bus travels from City A to City B at a unifo... |
| `cmt74hbek000312t9v53dxxua` | MCQ | Time, Speed & Distance | EASY | **INVALID** | mcq_data.correctAnswer is missing or empty | A high-speed train measuring 180 meters in length passe... |
| `cmt74hdyk000512t9m2bg32us` | MCQ | Time, Speed & Distance | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | A patrolling police officer spots a thief 200 meters ah... |
| `cmt74hega000712t9mx96h0f5` | MCQ | Time, Speed & Distance | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | A freight train of length 240 meters running at 54 km/h... |
| `cmt74hewi000912t9hrss1f5o` | MCQ | Time, Speed & Distance | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | A motorboat travels 36 km downstream along a river in 3... |
| `cmt74hfb3000b12t9x2sqz2vf` | MCQ | Time, Speed & Distance | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | A commuter walks to the office and rides back home in a... |
| `cmt74hfv3000d12t9ocfov6ex` | MCQ | Time, Speed & Distance | HARD | **INVALID** | mcq_data.correctAnswer is missing or empty | Two passenger trains of lengths 140 m and 160 m are tra... |
| `cmt74hgez000f12t9v2u4ijkr` | MCQ | Time, Speed & Distance | HARD | **INVALID** | mcq_data.correctAnswer is missing or empty | Walking at 3/4 of his usual speed, a student reaches hi... |
| `cmt74hgzu000h12t9pqlzrwys` | MCQ | Time, Speed & Distance | HARD | **INVALID** | mcq_data.correctAnswer is missing or empty | Two athletes run around a circular track of circumferen... |
| `cmt74hiz9000j12t9kb1whuxc` | MCQ | Time, Speed & Distance | EASY | **INVALID** | mcq_data.correctAnswer is missing or empty | A motorist covers the first half of a 120 km journey at... |
| `cmt74kdz400012m754b5a9tlt` | MCQ | Probability | EASY | **INVALID** | mcq_data.correctAnswer is missing or empty | Two fair six-sided dice are rolled simultaneously. What... |
| `cmt74kerr00032m7599tfnaf6` | MCQ | Probability | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | A single card is drawn at random from a standard well-s... |
| `cmt74kf5u00052m75ccfncz3p` | MCQ | Probability | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | A bag contains 5 red, 4 blue, and 3 green marbles. If t... |
| `cmt74kfkz00072m75vjv6o4bj` | MCQ | Probability | HARD | **INVALID** | mcq_data.correctAnswer is missing or empty | A and B independently shoot at a target. The probabilit... |
| `cmt74kivj00092m75mf8acuvy` | MCQ | Data Interpretation | EASY | **INVALID** | mcq_data.correctAnswer is missing or empty | In a company, the revenue in Year 1 was $400,000 and in... |
| `cmt74kja4000b2m75hhbtfqod` | MCQ | Data Interpretation | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | A family's monthly budget pie chart shows Food at 108 d... |
| `cmt74kjng000d2m75pn0h6iay` | MCQ | Data Interpretation | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | Sales of Branch X were 80, 100, and 120 units in years ... |
| `cmt74kkuq000f2m75cu1p0t5c` | MCQ | Data Interpretation | HARD | **INVALID** | mcq_data.correctAnswer is missing or empty | A factory produced 15,000 units in Q1 with a 4% defect ... |
| `cmt74kp5l000h2m75kfdofj2x` | MCQ | Permutation & Combination | EASY | **INVALID** | mcq_data.correctAnswer is missing or empty | In how many distinct ways can the letters of the word '... |
| `cmt74kpl7000j2m752yf5n2j8` | MCQ | Permutation & Combination | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | From a group of 7 men and 6 women, a committee of 5 per... |
| `cmt74kq0r000l2m75o7opqr4d` | MCQ | Permutation & Combination | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | In how many different ways can 6 executives be seated a... |
| `cmt74kqg9000n2m75cnd77mgj` | MCQ | Permutation & Combination | HARD | **INVALID** | mcq_data.correctAnswer is missing or empty | At the end of a corporate summit, every participant sha... |
| `cmt74kxmt000p2m75c2w3x8um` | MCQ | Averages | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | A batsman has a certain average of runs for 11 innings.... |
| `cmt74kyvo000r2m75x0kkk93d` | MCQ | Averages | EASY | **INVALID** | mcq_data.correctAnswer is missing or empty | The average age of 24 students in a class is 15 years. ... |
| `cmt74kz9x000t2m75rton2cai` | MCQ | Averages | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | The average weight of 8 persons increases by 2.5 kg whe... |
| `cmt74kzn7000v2m758tmbiruv` | MCQ | Averages | EASY | **INVALID** | mcq_data.correctAnswer is missing or empty | Section A of 30 students scored an average of 70 marks,... |
| `cmt74l147000x2m75lgubxn8w` | MCQ | Algebra | EASY | **INVALID** | mcq_data.correctAnswer is missing or empty | What are the roots of the quadratic equation x^2 - 7x +... |
| `cmt74l1ht000z2m75iklrla43` | MCQ | Algebra | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | If x + 1/x = 5, what is the numerical value of x^2 + 1/... |
| `cmt74l1v700112m753h1acfgo` | MCQ | Algebra | EASY | **INVALID** | mcq_data.correctAnswer is missing or empty | If 3x + 2y = 19 and 2x + 3y = 21, what is the value of ... |
| `cmt74l28800132m75ryjutuhj` | MCQ | Algebra | HARD | **INVALID** | mcq_data.correctAnswer is missing or empty | If a + b + c = 0, what is the value of (a^3 + b^3 + c^3... |
| `cmt74l5o600152m75nx8bfkij` | MCQ | Mensuration | EASY | **INVALID** | mcq_data.correctAnswer is missing or empty | A solid metallic cylinder has a base radius of 7 cm and... |
| `cmt74l62y00172m756k394aeg` | MCQ | Mensuration | EASY | **INVALID** | mcq_data.correctAnswer is missing or empty | A rectangular garden has a length of 12 meters and a wi... |
| `cmt74l6ho00192m75hgrf8bu3` | MCQ | Mensuration | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | What is the total surface area of a solid sphere whose ... |
| `cmt74l6v5001b2m75hbf93owu` | MCQ | Mensuration | HARD | **INVALID** | mcq_data.correctAnswer is missing or empty | A solid metallic cone of radius 6 cm and height 24 cm i... |
| `cmt74l7zu001d2m75abpdhyvi` | MCQ | Ratio and Proportion | EASY | **INVALID** | mcq_data.correctAnswer is missing or empty | An inheritance of ₹75,000 is to be divided among A, B, ... |
| `cmt74l8cz001f2m75ys109zbh` | MCQ | Ratio and Proportion | MEDIUM | **INVALID** | mcq_data.correctAnswer is missing or empty | If A : B = 2 : 3 and B : C = 4 : 5, what is the combine... |
| `cmt74ugze000112q4v5fpzaym` | CODING | Basic Coding | EASY | **INVALID** | No test cases found in coding_data | ### Problem Statement Given an integer `n` and limit `k... |
| `cmt74uhqh000312q4wl07qoc6` | CODING | Basic Coding | EASY | **INVALID** | No test cases found in coding_data | ### Problem Statement Given a user's name and age, retu... |
| `cmt74ui2y000512q4wx4bqrq0` | CODING | Basic Coding | EASY | **INVALID** | No test cases found in coding_data | ### Problem Statement Given a student's numerical score... |
| `cmt74uifq000712q4kmauty29` | CODING | Basic Coding | EASY | **INVALID** | No test cases found in coding_data | ### Problem Statement Given an array of integers `nums`... |
| `cmt74uis4000912q4g8ue6ykv` | CODING | Basic Coding | MEDIUM | **INVALID** | No test cases found in coding_data | ### Problem Statement You are given an array of integer... |
| `cms4jhrd5004q42qyjatzd0sa` | MCQ | Reasoning Ability | EASY | **NEEDS_FIX** | Exact duplicate question text found in 10 records | Looking at a portrait, a man said, 'I have no brothers ... |
| `cms4jhuuw004s42qyrmc7qyjf` | MCQ | Reasoning Ability | EASY | **NEEDS_FIX** | Exact duplicate question text found in 7 records | Given that: A is the brother of B, C is the father of A... |
| `cms4jhxep004u42qyfo14e0iv` | MCQ | Reasoning Ability | EASY | **NEEDS_FIX** | Exact duplicate question text found in 7 records | Given that: A is the brother of B, C is the father of A... |
| `cms4jhzin004w42qy9dyn85js` | MCQ | Reasoning Ability | EASY | **NEEDS_FIX** | Exact duplicate question text found in 7 records | Pointing to a man, a woman said, 'His mother is the onl... |
| `cms4ji1ga004y42qygvbes54c` | MCQ | Reasoning Ability | EASY | **NEEDS_FIX** | Exact duplicate question text found in 10 records | Looking at a portrait, a man said, 'I have no brothers ... |
| `cms4ji361005042qyyby70mj4` | MCQ | Reasoning Ability | EASY | **NEEDS_FIX** | Exact duplicate question text found in 4 records | Pointing towards a person in a photograph, Pinki said, ... |
| `cms4ji569005242qyttcexyo0` | MCQ | Reasoning Ability | EASY | **NEEDS_FIX** | Exact duplicate question text found in 7 records | A is the father of C, but C is not his son. How is C re... |
| `cms4ji7u9005442qy01cpmhyv` | MCQ | Reasoning Ability | EASY | **NEEDS_FIX** | Exact duplicate question text found in 7 records | Pointing to a man, a woman said, 'His mother is the onl... |
| `cms4jiai7005642qyz054kftb` | MCQ | Reasoning Ability | EASY | **NEEDS_FIX** | Exact duplicate question text found in 7 records | A is the father of C, but C is not his son. How is C re... |
| `cms4jiclt005842qywmw4sf45` | MCQ | Reasoning Ability | EASY | **NEEDS_FIX** | Exact duplicate question text found in 7 records | Pointing to a man, a woman said, 'His mother is the onl... |
| `cms4jiei8005a42qyw9e9rl0n` | MCQ | Reasoning Ability | EASY | **NEEDS_FIX** | Exact duplicate question text found in 10 records | Looking at a portrait, a man said, 'I have no brothers ... |
| `cms4jigfr005c42qylgo2daw8` | MCQ | Reasoning Ability | EASY | **NEEDS_FIX** | Exact duplicate question text found in 4 records | Deepak said to Nitin, 'That boy playing with the footba... |
| `cms4jiisp005e42qymp4jrml3` | MCQ | Reasoning Ability | EASY | **NEEDS_FIX** | Exact duplicate question text found in 5 records | M is the brother of N. B is the brother of N. M is the ... |
| `cms4jiki1005g42qynl10hf2n` | MCQ | Reasoning Ability | EASY | **NEEDS_FIX** | Exact duplicate question text found in 7 records | Pointing to a photograph, a man said, 'I have no brothe... |
| `cms4jiml3005i42qy9fv8343j` | MCQ | Reasoning Ability | EASY | **NEEDS_FIX** | Exact duplicate question text found in 5 records | M is the brother of N. B is the brother of N. M is the ... |
| `cms4jiofr005k42qy44scibk6` | MCQ | Reasoning Ability | EASY | **NEEDS_FIX** | Exact duplicate question text found in 7 records | A is the father of C, but C is not his son. How is C re... |
| `cms4jiql5005m42qyp91o5arb` | MCQ | Reasoning Ability | EASY | **NEEDS_FIX** | Exact duplicate question text found in 10 records | Looking at a portrait, a man said, 'I have no brothers ... |
| `cms4jiska005o42qyn02rtov7` | MCQ | Blood Relation | EASY | **NEEDS_FIX** | Exact duplicate question text found in 7 records | Given that: A is the brother of B, C is the father of A... |
| `cms4jiuqf005q42qy23mv598c` | MCQ | Reasoning Ability | EASY | **NEEDS_FIX** | Exact duplicate question text found in 3 records | A, B, and C are sisters. D is the brother of E and E is... |
| `cms4jiwpj005s42qyvjds5oml` | MCQ | Blood Relation | EASY | **NEEDS_FIX** | Exact duplicate question text found in 10 records | Looking at a portrait, a man said, 'I have no brothers ... |
| `cms4jmgcu007k42qyyz5s7zl5` | MCQ | Direction | EASY | **NEEDS_FIX** | Exact duplicate question text found in 2 records | At 3:00 PM, the minute hand of a clock points towards N... |
| `cms4jmiak007m42qynes2a9c5` | MCQ | Direction | EASY | **NEEDS_FIX** | Exact duplicate question text found in 2 records | A car travels 12 km North, turns right and travels 5 km... |
| `cms4jmk43007o42qy3k4so3vv` | MCQ | Direction | EASY | **NEEDS_FIX** | Exact duplicate question text found in 2 records | A traveler walks 10 km towards North, turns right and w... |
| `cms4jmm1v007q42qyf0cx40ip` | MCQ | Direction | EASY | **NEEDS_FIX** | Exact duplicate question text found in 4 records | Two friends A and B start walking from the same point. ... |
| `cms4jmq85007u42qy0h9dsxwl` | MCQ | Direction | EASY | **NEEDS_FIX** | Exact duplicate question text found in 2 records | A car travels 12 km North, turns right and travels 5 km... |
| `cms4jmshm007w42qyz92skzka` | MCQ | Direction | EASY | **NEEDS_FIX** | Exact duplicate question text found in 2 records | If North is called West, West is called South, South is... |
| `cms4jmu8t007y42qy9s3iaivm` | MCQ | Direction | EASY | **NEEDS_FIX** | Exact duplicate question text found in 4 records | Two friends A and B start walking from the same point. ... |
| `cms4jmzq4008442qylebtujtx` | MCQ | Direction | EASY | **NEEDS_FIX** | Exact duplicate question text found in 4 records | Two friends A and B start walking from the same point. ... |
| `cms4jn5sl008a42qy6wok6q12` | MCQ | Direction | EASY | **NEEDS_FIX** | Exact duplicate question text found in 2 records | At 3:00 PM, the minute hand of a clock points towards N... |
| `cms4jn7tb008c42qyhrm59w19` | MCQ | Direction | EASY | **NEEDS_FIX** | Exact duplicate question text found in 2 records | If North is called West, West is called South, South is... |
| `cms4jnc3f008g42qyzqbatapu` | MCQ | Direction | EASY | **NEEDS_FIX** | Exact duplicate question text found in 4 records | Two friends A and B start walking from the same point. ... |
| `cms4jne6w008i42qy8alhehmc` | MCQ | Direction | EASY | **NEEDS_FIX** | Exact duplicate question text found in 2 records | A traveler walks 10 km towards North, turns right and w... |
| `cms4kq2ka002lnyixqzmd9col` | MCQ | Fullstack Software Engineering 2026 | MEDIUM | **NEEDS_FIX** | Exact duplicate question text found in 2 records | In a React component, which of the following actions wi... |
| `cms4kq91f002vnyix4bu9tg4c` | MCQ | Fullstack Software Engineering 2026 | MEDIUM | **NEEDS_FIX** | Exact duplicate question text found in 2 records | In a React component, which of the following actions wi... |
| `cms4kqbhp002znyixpkbkdp67` | MCQ | Fullstack Software Engineering 2026 | MEDIUM | **NEEDS_FIX** | Exact duplicate question text found in 2 records | In a React application, which of the following actions ... |
| `cms7550ib004d8qjzngwmt6tn` | MCQ | Ages | EASY | **NEEDS_FIX** | Exact duplicate question text found in 2 records | The sum of the present ages of Ajay and his wife Sushma... |
| `cms755ldr004f8qjz4sjv2rc1` | MCQ | Ages | EASY | **NEEDS_FIX** | Exact duplicate question text found in 2 records | The sum of the present ages of Ajay and his wife Sushma... |
| `cms755nuo004h8qjz0zyqgybg` | MCQ | LCM & HCF | MEDIUM | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | Find the sum of the LCM and HCF of the fractions 55/8, ... |
| `cms755rsu004l8qjzm7mwf8oy` | MCQ | LCM & HCF | MEDIUM | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | Find the sum of the LCM and HCF of the fractions 22/7, ... |
| `cms76v9hk003pk61z23jtcyve` | MCQ | Reasoning Ability | EASY | **NEEDS_FIX** | Exact duplicate question text found in 10 records | Looking at a portrait, a man said, 'I have no brothers ... |
| `cms76vbho003rk61zhyteu36h` | MCQ | Blood Relation | EASY | **NEEDS_FIX** | Exact duplicate question text found in 4 records | Deepak said to Nitin, 'That boy playing with the footba... |
| `cms76vdwo003tk61z4orzpi2f` | MCQ | Reasoning Ability | EASY | **NEEDS_FIX** | Exact duplicate question text found in 10 records | Looking at a portrait, a man said, 'I have no brothers ... |
| `cms76vfrd003vk61z0yiyecp8` | MCQ | Reasoning Ability | EASY | **NEEDS_FIX** | Exact duplicate question text found in 7 records | Pointing to a photograph, a man said, 'I have no brothe... |
| `cms76vh2b003xk61zrpxmxp82` | MCQ | Blood Relation | EASY | **NEEDS_FIX** | Exact duplicate question text found in 4 records | Pointing towards a person in a photograph, Pinki said, ... |
| `cms76vj5g003zk61z2blqvjgr` | MCQ | Reasoning Ability | EASY | **NEEDS_FIX** | Exact duplicate question text found in 7 records | Given that: A is the brother of B, C is the father of A... |
| `cms76vl5y0041k61zoavntip1` | MCQ | Reasoning Ability | EASY | **NEEDS_FIX** | Exact duplicate question text found in 7 records | Pointing to a photograph, a man said, 'I have no brothe... |
| `cms76vmub0043k61zig992nvr` | MCQ | Reasoning Ability | EASY | **NEEDS_FIX** | Exact duplicate question text found in 2 records | If A is the mother of B, C is the son of A, D is the br... |
| `cms76vo5f0045k61z3v0obb6k` | MCQ | Reasoning Ability | EASY | **NEEDS_FIX** | Exact duplicate question text found in 7 records | A is the father of C, but C is not his son. How is C re... |
| `cms76vpmi0047k61ztkcfu1fp` | MCQ | Reasoning Ability | EASY | **NEEDS_FIX** | Exact duplicate question text found in 7 records | Pointing to a photograph, a man said, 'I have no brothe... |
| `cms76vqyy0049k61zb9g9d39n` | MCQ | Reasoning Ability | EASY | **NEEDS_FIX** | Exact duplicate question text found in 7 records | A is the father of C, but C is not his son. How is C re... |
| `cms76vsk9004bk61zash7l32s` | MCQ | Reasoning Ability | EASY | **NEEDS_FIX** | Exact duplicate question text found in 4 records | Deepak said to Nitin, 'That boy playing with the footba... |
| `cms76vubb004dk61zfjfl34cg` | MCQ | Reasoning Ability | EASY | **NEEDS_FIX** | Exact duplicate question text found in 7 records | Given that: A is the brother of B, C is the father of A... |
| `cms76vvm8004fk61z14ctaijd` | MCQ | Blood Relation | EASY | **NEEDS_FIX** | Exact duplicate question text found in 7 records | Pointing to a man, a woman said, 'His mother is the onl... |
| `cms76vwy1004hk61z1bv639mm` | MCQ | Blood Relation | EASY | **NEEDS_FIX** | Exact duplicate question text found in 3 records | A, B, and C are sisters. D is the brother of E and E is... |
| `cms76vzis004jk61zvfbter98` | MCQ | Blood Relation | EASY | **NEEDS_FIX** | Exact duplicate question text found in 7 records | Pointing to a photograph, a man said, 'I have no brothe... |
| `cms76w162004lk61zpay3ge59` | MCQ | Reasoning Ability | EASY | **NEEDS_FIX** | Exact duplicate question text found in 10 records | Looking at a portrait, a man said, 'I have no brothers ... |
| `cms76w2h6004nk61zjp1dw3gr` | MCQ | Blood Relation | EASY | **NEEDS_FIX** | Exact duplicate question text found in 5 records | M is the brother of N. B is the brother of N. M is the ... |
| `cms76w3yw004pk61zdzhnv16z` | MCQ | Blood Relation | EASY | **NEEDS_FIX** | Exact duplicate question text found in 7 records | Pointing to a photograph, a man said, 'I have no brothe... |
| `cms76w5g9004rk61zk95e7pq1` | MCQ | Reasoning Ability | EASY | **NEEDS_FIX** | Exact duplicate question text found in 7 records | Pointing to a man, a woman said, 'His mother is the onl... |
| `cms76wgzf004tk61zrnj1f9yw` | MCQ | Reasoning Ability | EASY | **NEEDS_FIX** | Exact duplicate question text found in 7 records | Given that: A is the brother of B, C is the father of A... |
| `cms76wiq3004vk61z2cjoac6i` | MCQ | Blood Relation | EASY | **NEEDS_FIX** | Exact duplicate question text found in 7 records | A is the father of C, but C is not his son. How is C re... |
| `cms76wk34004xk61zm9ouimsq` | MCQ | Reasoning Ability | EASY | **NEEDS_FIX** | Exact duplicate question text found in 4 records | Pointing towards a person in a photograph, Pinki said, ... |
| `cms76wmme004zk61zpc2iw35i` | MCQ | Reasoning Ability | EASY | **NEEDS_FIX** | Exact duplicate question text found in 7 records | Pointing to a man, a woman said, 'His mother is the onl... |
| `cms76wpz70051k61zkm5rwtj5` | MCQ | Reasoning Ability | EASY | **NEEDS_FIX** | Exact duplicate question text found in 4 records | Pointing towards a person in a photograph, Pinki said, ... |
| `cms78ji110017itkofmwtalh1` | MCQ | Reasoning Ability | HARD | **NEEDS_FIX** | Exact duplicate question text found in 2 records | Pointing to a gentleman, Deepak said, 'His only brother... |
| `cms78ju2g001jitkop183i6mw` | MCQ | Blood Relation | HARD | **NEEDS_FIX** | Exact duplicate question text found in 2 records | Pointing to a man in a photograph, a woman said, 'His m... |
| `cms78jvpa001litkox4rbcbnl` | MCQ | Reasoning Ability | EASY | **NEEDS_FIX** | Exact duplicate question text found in 7 records | Pointing to a photograph, a man said, 'I have no brothe... |
| `cms78jx5p001nitkor0zqje75` | MCQ | Blood Relation | HARD | **NEEDS_FIX** | Exact duplicate question text found in 2 records | Pointing to a gentleman, Deepak said, 'His only brother... |
| `cms78jz5x001pitko10ljhiif` | MCQ | Reasoning Ability | HARD | **NEEDS_FIX** | Exact duplicate question text found in 2 records | Pointing to a man in a photograph, a woman said, 'His m... |
| `cmsctm8me004dysd6g5id10i1` | MCQ | LCM & HCF | MEDIUM | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | Find the sum of the LCM and HCF of the fractions 38/2, ... |
| `cmsctmali004fysd67h9tjz1h` | MCQ | LCM & HCF | MEDIUM | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | Find the sum of the LCM and HCF of the fractions 6/25, ... |
| `cmsctmdaf004hysd61m991b7t` | MCQ | LCM & HCF | MEDIUM | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | Find the sum of the LCM and HCF of the fractions 32/9, ... |
| `cmsctq3hv006oysd6wl23mmwy` | MCQ | LCM & HCF | MEDIUM | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | Find the sum of the LCM and HCF of the fractions 20/28,... |
| `cmsctq8qf006uysd6omirxy9h` | MCQ | LCM & HCF | MEDIUM | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | Find the sum of the LCM and HCF of the fractions 61/19,... |
| `cmsctqqmx006wysd6pmunc5hq` | MCQ | LCM & HCF | HARD | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | Find the sum of the LCM and HCF of the fractions 10/16,... |
| `cmsctr744007gysd6dca9sla1` | MCQ | Reasoning Ability | EASY | **NEEDS_FIX** | Exact duplicate question text found in 10 records | Looking at a portrait, a man said, 'I have no brothers ... |
| `cmsctr8jk007iysd6re0vp0vl` | MCQ | Reasoning Ability | EASY | **NEEDS_FIX** | Exact duplicate question text found in 5 records | M is the brother of N. B is the brother of N. M is the ... |
| `cmsctr9sy007kysd6m1hh7czd` | MCQ | Blood Relation | EASY | **NEEDS_FIX** | Exact duplicate question text found in 2 records | If A is the mother of B, C is the son of A, D is the br... |
| `cmsctrbad007mysd6m56yohdd` | MCQ | Reasoning Ability | EASY | **NEEDS_FIX** | Exact duplicate question text found in 5 records | M is the brother of N. B is the brother of N. M is the ... |
| `cmsctrcwh007oysd6la0ikv5o` | MCQ | Reasoning Ability | EASY | **NEEDS_FIX** | Exact duplicate question text found in 4 records | Deepak said to Nitin, 'That boy playing with the footba... |
| `cmsctrejo007qysd68xksv9cd` | MCQ | Reasoning Ability | EASY | **NEEDS_FIX** | Exact duplicate question text found in 7 records | Given that: A is the brother of B, C is the father of A... |
| `cmsctrg1h007sysd6nkxcj24g` | MCQ | Reasoning Ability | EASY | **NEEDS_FIX** | Exact duplicate question text found in 3 records | A, B, and C are sisters. D is the brother of E and E is... |
| `cmsctrhjb007uysd6j4443fus` | MCQ | Reasoning Ability | EASY | **NEEDS_FIX** | Exact duplicate question text found in 7 records | A is the father of C, but C is not his son. How is C re... |
| `cmsctriuc007wysd64lo63zkl` | MCQ | Blood Relation | EASY | **NEEDS_FIX** | Exact duplicate question text found in 7 records | Pointing to a man, a woman said, 'His mother is the onl... |
| `cmsctrk5l007yysd6cmb6edws` | MCQ | Reasoning Ability | EASY | **NEEDS_FIX** | Exact duplicate question text found in 10 records | Looking at a portrait, a man said, 'I have no brothers ... |
| `cmsef7b2y000vks3nnaf3y52g` | MCQ | Time, Speed & Distance | MEDIUM | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | A person takes 22 hours to complete a journey. If the s... |
| `cmsef7dhf000xks3n6d6t6bjy` | MCQ | Time, Speed & Distance | MEDIUM | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | A person takes 89 hours to complete a journey. If the s... |
| `cmsef7f37000zks3nbpin9kec` | MCQ | Time, Speed & Distance | MEDIUM | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | A person takes 88 hours to complete a journey. If the s... |
| `cmsef7gmd0011ks3nc705u5yp` | MCQ | Time, Speed & Distance | MEDIUM | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | A person takes 78 hours to complete a journey. If the s... |
| `cmsef7igg0013ks3nk5bermzq` | MCQ | Time, Speed & Distance | MEDIUM | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | A person takes 51 hours to complete a journey. If the s... |
| `cmsef7k9v0015ks3nij3whni0` | MCQ | Time, Speed & Distance | MEDIUM | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | A person takes 13 hours to complete a journey. If the s... |
| `cmsef7lvt0017ks3nd890pyqx` | MCQ | Time, Speed & Distance | MEDIUM | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | A person takes 10 hours to complete a journey. If the s... |
| `cmsef7nlv0019ks3n9sayuk6a` | MCQ | Time, Speed & Distance | MEDIUM | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | A person takes 11 hours to complete a journey. If the s... |
| `cmsef7p46001bks3nv3p269fa` | MCQ | Time, Speed & Distance | MEDIUM | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | A person takes 47 hours to complete a journey. If the s... |
| `cmsef7qoz001dks3nc60vm604` | MCQ | Time, Speed & Distance | MEDIUM | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | A person takes 57 hours to complete a journey. If the s... |
| `cmsef8frp001hks3nqkho80vt` | MCQ | Ages | MEDIUM | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | Kiran is 10 years older than Rohan. 8 years ago, Kiran ... |
| `cmsef8hoa001jks3ngkfz2ni8` | MCQ | Ages | MEDIUM | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | Kiran is 13 years older than Rohan. 9 years ago, Kiran ... |
| `cmsef8j4h001lks3n2mt7ijrl` | MCQ | Ages | MEDIUM | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | Kiran is 12 years older than Rohan. 3 years ago, Kiran ... |
| `cmsef8kih001nks3no2l3az18` | MCQ | Ages | MEDIUM | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | Kiran is 11 years older than Rohan. 7 years ago, Kiran ... |
| `cmsef8nas001pks3ns16e91vy` | MCQ | Ages | MEDIUM | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | Kiran is 14 years older than Rohan. 3 years ago, Kiran ... |
| `cmsef8ppw001rks3n31k5qccb` | MCQ | Ages | MEDIUM | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | Kiran is 15 years older than Rohan. 9 years ago, Kiran ... |
| `cmsef8ref001tks3nqfyds1ox` | MCQ | Ages | MEDIUM | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | Kiran is 2 years older than Rohan. 6 years ago, Kiran w... |
| `cmsef9ec5001zks3ngeynx1t1` | MCQ | Profit & Loss | MEDIUM | **NEEDS_FIX** | Explanation cites Option A (Index 1), but the correct answer | An article is marked at ₹584. A discount of 37% is offe... |
| `cmseku28l00l31m0tc23hex00` | MCQ | Ages | EASY | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | The present age of a child is 20 years. The parent is 3... |
| `cmsel0vmf000g8kntfjpxppy1` | MCQ | Area | EASY | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | A rectangle has a length of 31 cm and a breadth of 5 cm... |
| `cmsel171x000i8knt1hh5cbck` | MCQ | Area | EASY | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | A rectangle has a length of 47 cm and a breadth of 70 c... |
| `cmsel1elk000k8kntvjwkmjbc` | MCQ | Area | EASY | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | A rectangle has a length of 22 cm and a breadth of 54 c... |
| `cmsel1iib000m8knt4la7q1md` | MCQ | Area | EASY | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | A rectangle has a length of 27 cm and a breadth of 32 c... |
| `cmsel4tkq000s8kntm51l91zh` | MCQ | Algebra | MEDIUM | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | Find the sum of the reciprocals of 3 and 14.... |
| `cmsfoa5d300403c4i4tzvt028` | MCQ | Ratio and Proportion | MEDIUM | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | The number of type A and type B coins are in the ratio ... |
| `cmsfoa65400423c4i9xczt9g5` | MCQ | Ratio and Proportion | MEDIUM | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | The number of type A and type B coins are in the ratio ... |
| `cmsfoa6s200443c4in05l5vjy` | MCQ | Ratio and Proportion | MEDIUM | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | The number of type A and type B coins are in the ratio ... |
| `cmsfoaalf004a3c4iul09zg90` | MCQ | Simple & Compound Interest | MEDIUM | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | Find the Simple Interest on ₹44719 at 6% per annum for ... |
| `cmsfoabaa004c3c4i3xpp6dwy` | MCQ | Simple & Compound Interest | MEDIUM | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | Find the Simple Interest on ₹32680 at 6% per annum for ... |
| `cmsfoac1n004e3c4it8yhfqwp` | MCQ | Simple & Compound Interest | MEDIUM | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | Find the Simple Interest on ₹45713 at 12% per annum for... |
| `cmsfoadxa004g3c4iw7i111tg` | MCQ | Simple & Compound Interest | MEDIUM | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | Find the Simple Interest on ₹18871 at 16% per annum for... |
| `cmsfoamgf004i3c4iot8l6ig8` | MCQ | Simple & Compound Interest | MEDIUM | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | Find the Simple Interest on ₹30152 at 17% per annum for... |
| `cmsfoanyi004k3c4it6d73oko` | MCQ | Simple & Compound Interest | EASY | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | Find the Simple Interest on ₹15065 at 14% per annum for... |
| `cmsfoaqyj004m3c4isr3odsct` | MCQ | Simple & Compound Interest | MEDIUM | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | Find the Simple Interest on ₹12821 at 2% per annum for ... |
| `cmsfoav4p004o3c4i6uxrqb6o` | MCQ | Simple & Compound Interest | MEDIUM | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | Find the Simple Interest on ₹46701 at 8% per annum for ... |
| `cmsfoazko004u3c4i4aiz62ds` | MCQ | Area | EASY | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | A rectangle has a length of 31 cm and a breadth of 88 c... |
| `cmsfodz11005q3c4itx313i1p` | MCQ | Percentages | MEDIUM | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | In a survey, 69% people belong to group A, 48% people b... |
| `cmsfoe34g005s3c4ik09scehx` | MCQ | Percentages | MEDIUM | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | In a survey, 42% people belong to group A, 63% people b... |
| `cmsfoe4yd005u3c4inzqhnxw9` | MCQ | Percentages | EASY | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | In a survey, 30% people belong to group A, 72% people b... |
| `cmsfoe6dl005w3c4ik0g54phs` | MCQ | Percentages | MEDIUM | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | In a survey, 23% people belong to group A, 79% people b... |
| `cmsfoe81b005y3c4il6n2d2uc` | MCQ | Percentages | MEDIUM | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | In a survey, 73% people belong to group A, 28% people b... |
| `cmsfoe9gj00603c4ipw6x2zh4` | MCQ | Percentages | EASY | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | In a survey, 41% people belong to group A, 25% people b... |
| `cmsfoeb4700623c4i4try5gnz` | MCQ | Percentages | MEDIUM | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | In a survey, 65% people belong to group A, 33% people b... |
| `cmsfoecqw00643c4i7zhd1j5k` | MCQ | Percentages | MEDIUM | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | In a survey, 50% people belong to group A, 70% people b... |
| `cmsfoeecc00663c4iqmgmmo34` | MCQ | Percentages | MEDIUM | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | In a survey, 34% people belong to group A, 49% people b... |
| `cmsfoeg2v00683c4iget0p8i0` | MCQ | Percentages | MEDIUM | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | In a survey, 49% people belong to group A, 53% people b... |
| `cmshbn56h0008j6h3v5f29rso` | MCQ | Averages | EASY | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | The average of 49 items is 17. What is the sum of all t... |
| `cmshel63r00073eixp4a6a2j0` | MCQ | Blood Relation | HARD | **NEEDS_FIX** | Explanation cites Option A (Index 1), but the correct answer | In a family gathering, a man stated, 'Her brother's mot... |
| `cmsj67eje0021tsy9j4vspaxh` | MCQ | Averages | MEDIUM | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | The sum of ages of A and B is 40 years. After 7 years, ... |
| `cmsj67jsn0023tsy9a452vt4c` | MCQ | Averages | HARD | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | The average age of Ram and Mohan is 58 years, which is ... |
| `cmsj67l700025tsy9z0carfuv` | MCQ | Reciprocal | EASY | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | If x = 4, y = 3 and it is given that x and y are more t... |
| `cmsk33za1001lkssr52km3zmo` | MCQ | Algebra | MEDIUM | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | What is the reciprocal of 12/84?... |
| `cmsk3q74p001xkssr8fh66dfo` | MCQ | Algebra | MEDIUM | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | Find the sum of the reciprocals of 10 and 22.... |
| `cmsk3tne70022kssrhx4fm2fv` | MCQ | Mensuration | EASY | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | The area of a regular hexagon is 314.36 cm². What is th... |
| `cmsk3vwmf0027kssrji2tr1y9` | MCQ | Mensuration | EASY | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | The area of a regular hexagon is 3951.56 cm². What is t... |
| `cmsk4blyn002ckssr7khvxgb5` | MCQ | Mensuration | EASY | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | The area of a regular hexagon is 210.44 cm². What is th... |
| `cmsk4id34002hkssrce4lhmmi` | MCQ | Probability | MEDIUM | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | A bag contains 21 yellow balls, 33 blue balls and some ... |
| `cmsk4jt2q002mkssrlpg7zk9k` | MCQ | Probability | MEDIUM | **NEEDS_FIX** | metadata.options has different ordering than mcq_data.option | A bag contains 16 yellow balls, 23 blue balls and some ... |
| `cmsk4m0em002rkssredkfkfny` | MCQ | Probability | MEDIUM | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | A bag contains 19 yellow balls, 29 blue balls and some ... |
| `cmsms994b001052otayh1take` | MCQ | Averages | MEDIUM | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | The sum of ages of A and B is 37 years. After 2 years, ... |
| `cmsmtc6cn001x52oth4sry48y` | MCQ | Time & Work | MEDIUM | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | If 448 units of work can be completed by 827 workers in... |
| `cmsmtc8j9001z52oty3pldyeg` | MCQ | Time & Work | MEDIUM | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | If 451 units of work can be completed by 549 workers in... |
| `cmsmtcblt002352otzkl43ksj` | MCQ | Time & Work | MEDIUM | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | If 260 units of work can be completed by 221 workers in... |
| `cmsmtcbw9002552otiwwbg0di` | MCQ | Time & Work | MEDIUM | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | If 390 units of work can be completed by 631 workers in... |
| `cmsmtcchj002752otcpp1cayv` | MCQ | Time & Work | MEDIUM | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | If 441 units of work can be completed by 789 workers in... |
| `cmsmtccqi002952otk2ed0pb1` | MCQ | Time & Work | MEDIUM | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | If 389 units of work can be completed by 608 workers in... |
| `cmsmtcd53002b52ots5f5t7pt` | MCQ | Time & Work | MEDIUM | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | If 67 units of work can be completed by 787 workers in ... |
| `cmsmttdyd002n52otynr5pvpa` | MCQ | Reciprocal | EASY | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | If x = 6, y = 3, and x and y are more than their respec... |
| `cmsmttekn002p52otvilhg43k` | MCQ | Time & Work | MEDIUM | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | If 451 units of work can be completed by 650 workers in... |
| `cmsmtteza002r52ot2szw7tpf` | MCQ | Time & Work | MEDIUM | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | If 115 units of work can be completed by 580 workers in... |
| `cmsmu9es2003u52otv1ym5rcf` | MCQ | Reciprocal | MEDIUM | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | A sum of Rs 7500 amounts to Rs 9075 at 10% p.a in a cer... |
| `cmsmu9f9t003w52otc981ckeq` | MCQ | Reciprocal | MEDIUM | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | A sum of Rs 7500 amounts to Rs 9075 at 10% p.a in a cer... |
| `cmsmuobz4003y52otfybzfmvu` | MCQ | Reciprocal | EASY | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | If x = 10, y = 8, and x and y are more than their respe... |
| `cmspmr9zm001ighqbfjpc9yqx` | MCQ | Percentages | MEDIUM | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | If 36% of a number is 363, what is the value of the num... |
| `cmspmrcih001kghqberp8599s` | MCQ | Percentages | HARD | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | If 23% of a number is 748, what is the value of the num... |
| `cmspmrfqb001mghqba5lef2ei` | MCQ | Percentages | HARD | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | If 61% of a number is 479, what is the value of the num... |
| `cmspmrhjy001oghqbxv7m2spt` | MCQ | Percentages | MEDIUM | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | If 20% of a number is 97, what is the value of the numb... |
| `cmspmt30c0023ghqbq9u9aa20` | MCQ | Profit & Loss | MEDIUM | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | A shopkeeper purchased an item for ₹271 and sold it for... |
| `cmspmt5gp0025ghqb1zqnir1d` | MCQ | Profit & Loss | HARD | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | A shopkeeper purchased an item for ₹1352 and sold it fo... |
| `cmspmt8gr0027ghqberjwl9j9` | MCQ | Profit & Loss | MEDIUM | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | A shopkeeper purchased an item for ₹1758 and sold it fo... |
| `cmspmtbcl0029ghqbh7y8hzis` | MCQ | Profit & Loss | MEDIUM | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | A shopkeeper purchased an item for ₹1380 and sold it fo... |
| `cmspojfg4001fejw6ti8zv0v9` | MCQ | Statements and Conclusion | MEDIUM | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | There are 440 shares of a company. How many shares are ... |
| `cmspojht9001hejw6o0ne7oxf` | MCQ | Statements and Conclusion | MEDIUM | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | There are 276 shares of a company. How many shares are ... |
| `cmspojjwe001jejw6avo527z9` | MCQ | Statements and Conclusion | MEDIUM | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | There are 496 shares of a company. How many shares are ... |
| `cmspojm2y001lejw6tewkq4xy` | MCQ | Statements and Conclusion | MEDIUM | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | There are 455 shares of a company. How many shares are ... |
| `cmspojoo2001nejw6s4hxwl5f` | MCQ | Statements and Conclusion | MEDIUM | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | There are 436 shares of a company. How many shares are ... |
| `cmspoqa35002lejw6f3cwxxx7` | MCQ | Time, Speed & Distance | HARD | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | A train is moving at 49 km/hr. If it crosses a pole in ... |
| `cmspoqcpu002nejw6levvqy2c` | MCQ | Time, Speed & Distance | HARD | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | A train is moving at 75 km/hr. If it crosses a pole in ... |
| `cmspoqetq002pejw60tm7t60h` | MCQ | Time, Speed & Distance | HARD | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | A train is moving at 92 km/hr. If it crosses a pole in ... |
| `cmspoqh0r002rejw60w438hpu` | MCQ | Time, Speed & Distance | HARD | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | A train is moving at 117 km/hr. If it crosses a pole in... |
| `cmsr39j6100bg9kti1k937in5` | MCQ | Algebra | MEDIUM | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | What is the reciprocal of 40/3?... |
| `cmsr3bq6500by9ktihiov501p` | MCQ | Mensuration | EASY | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | The area of a regular hexagon is 4367.24 cm². What is t... |
| `cmsr3f4dm00cq9kti1yjfr3ga` | MCQ | Mensuration | EASY | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | The area of a regular hexagon is 3556.66 cm². What is t... |
| `cmsr3q95l00g79ktiaierrmnf` | MCQ | Mensuration | EASY | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | The area of a regular hexagon is 1496.45 cm². What is t... |
| `cmsr42k2100ib9kti3192eago` | MCQ | Probability | MEDIUM | **NEEDS_FIX** | metadata.options has different option content than mcq_data. | A bag contains 8 yellow balls, 7 blue balls and some re... |
| `cmt3wzkht002wnhc3rcu9ja49` | MCQ | Sentence Correction | EASY | **NEEDS_FIX** | Explanation cites Option C (Index 3), but the correct answer | Identify the grammatically correct sentence from the op... |
| `cmt3wzr5p002ynhc3g70unfha` | MCQ | Sentence Correction | EASY | **NEEDS_FIX** | Explanation cites Option A (Index 1), but the correct answer | Select the correct version of the following sentence: '... |
| `cmt3x04cb0032nhc354buyw3a` | MCQ | Sentence Correction | EASY | **NEEDS_FIX** | Explanation cites Option A (Index 1), but the correct answer | Identify the correct sentence from the options below.... |
| `cmt3x1l34003gnhc3zle25wob` | MCQ | Sentence Correction | EASY | **NEEDS_FIX** | Explanation cites Option A (Index 1), but the correct answer | Select the grammatically correct request.... |
| `cmt3x1yf3003inhc37zslhmk7` | MCQ | Sentence Correction | EASY | **NEEDS_FIX** | Explanation cites Option A (Index 1), but the correct answer | Select the grammatically correct sentence.... |
| `cmt3x2bly003mnhc3g37o8bcy` | MCQ | Sentence Correction | EASY | **NEEDS_FIX** | Explanation cites Option A (Index 1), but the correct answer | Which of the following sentences is grammatically corre... |
| `cmt3x3f6i003ynhc3pv3dxqfn` | MCQ | Sentence Correction | EASY | **NEEDS_FIX** | Explanation cites Option A (Index 1), but the correct answer | Select the correct statement regarding the project dead... |
| `cmt3x45jo0044nhc37d870ofg` | MCQ | Sentence Correction | EASY | **NEEDS_FIX** | Explanation cites Option B (Index 2), but the correct answer | Select the correct statement regarding the team's proje... |
| `cmt3x462p0046nhc3w7gjavvz` | MCQ | Sentence Correction | EASY | **NEEDS_FIX** | Explanation cites Option B (Index 2), but the correct answer | Select the correct statement regarding the team's proje... |
| `cmt3ycktt000ds8z1q3pbuies` | MCQ | Sentence Correction | MEDIUM | **NEEDS_FIX** | Explanation cites Option B (Index 2), but the correct answer | Select the grammatically correct sentence regarding the... |
| `cmt3ycma8000fs8z1mb1reypg` | MCQ | Sentence Correction | MEDIUM | **NEEDS_FIX** | Explanation cites Option B (Index 2), but the correct answer | Select the correctly structured sentence regarding the ... |
| `cmt3yco0q000hs8z1fe85usxp` | MCQ | Sentence Correction | MEDIUM | **NEEDS_FIX** | Explanation cites Option B (Index 2), but the correct answer | Identify the grammatically correct sentence among the f... |
| `cmt3ycpth000js8z1ixocem8c` | MCQ | Sentence Correction | MEDIUM | **NEEDS_FIX** | Explanation cites Option C (Index 3), but the correct answer | Select the grammatically correct option regarding the p... |
| `cmt40rjm600107ggggovhofu9` | MCQ | Sentence Correction | HARD | **NEEDS_FIX** | Explanation cites Option B (Index 2), but the correct answer | Identify the grammatically correct sentence regarding t... |
| `cmt40rwlz00187gggocn38dxo` | MCQ | Sentence Correction | HARD | **NEEDS_FIX** | Explanation cites Option C (Index 3), but the correct answer | Identify the grammatically correct sentence about the p... |
| `cmt40ry71001a7ggg9krex4sd` | MCQ | Sentence Correction | HARD | **NEEDS_FIX** | Explanation cites Option A (Index 1), but the correct answer | Select the grammatically correct version of the followi... |
| `cmt40s237001e7gggapd3m622` | MCQ | Sentence Correction | HARD | **NEEDS_FIX** | Explanation cites Option A (Index 1), but the correct answer | Select the option that represents the correct use of th... |
| `cmt40s6aq001g7gggkagmhwte` | MCQ | Sentence Correction | HARD | **NEEDS_FIX** | Explanation cites Option A (Index 1), but the correct answer | Identify the grammatically correct sentence regarding p... |
| `cmt40shi5001o7gggj85p2t0z` | MCQ | Sentence Correction | HARD | **NEEDS_FIX** | Explanation cites Option A (Index 1), but the correct answer | Identify the correctly constructed sentence regarding t... |
| `cmt40sksa001s7gggs3dybiut` | MCQ | Sentence Correction | MEDIUM | **NEEDS_FIX** | Explanation cites Option C (Index 3), but the correct answer | Identify the sentence with correct subject-verb agreeme... |
| `cmt411q2i00337gggbn6c9nh7` | MCQ | Sentence Correction | MEDIUM | **NEEDS_FIX** | Explanation cites Option A (Index 1), but the correct answer | Which of the following sentences is grammatically accur... |
| `cmt411y5t00397gggnqeupbao` | MCQ | Sentence Correction | MEDIUM | **NEEDS_FIX** | Explanation cites Option A (Index 1), but the correct answer | Identify the correct sentence among the following optio... |
| `cmt47g5ds000xlcuj8wh51szo` | MCQ | Number Series | EASY | **NEEDS_FIX** | Explanation cites Option A (Index 1), but the correct answer | Identify the next number in the sequence: 15, 30, 60, 1... |
| `cmt47gc35000zlcujlm0pk1ct` | MCQ | Number Series | EASY | **NEEDS_FIX** | Explanation cites Option A (Index 1), but the correct answer | Find the missing number: 12, 18, 27, 39, 54, ?... |
| `cmt47gimk0011lcujtkddiqoz` | MCQ | Number Series | EASY | **NEEDS_FIX** | Explanation cites Option A (Index 1), but the correct answer | Determine the next number in the series: 5, 10, 20, 40,... |
| `cmt47gpb50013lcuj0a5ywvex` | MCQ | Number Series | EASY | **NEEDS_FIX** | Explanation cites Option A (Index 1), but the correct answer | Identify the missing value in the sequence: 3, 8, 15, 2... |
| `cmt47gvun0015lcujekkhfhis` | MCQ | Number Series | EASY | **NEEDS_FIX** | Explanation cites Option B (Index 2), but the correct answer | Determine the missing number in the series: 3, 9, 21, 3... |
| `cmt47hfrh001blcujdqotvsea` | MCQ | Number Series | EASY | **NEEDS_FIX** | Explanation cites Option A (Index 1), but the correct answer | Find the next number: 7, 14, 28, 56, 112, ?... |
| `cmt47hmfz001dlcujnvaezl90` | MCQ | Number Series | EASY | **NEEDS_FIX** | Explanation cites Option A (Index 1), but the correct answer | Find the next number in the sequence: 5, 10, 20, 40, 80... |
| `cmt47hszb001flcuj9nzz098o` | MCQ | Number Series | EASY | **NEEDS_FIX** | Explanation cites Option A (Index 1), but the correct answer | Identify the missing number in the following series: 6,... |
| `cmt47qxb3002elcujz9cuun7u` | MCQ | Number Series | MEDIUM | **NEEDS_FIX** | Explanation cites Option A (Index 1), but the correct answer | Identify the missing number in the sequence: 150, 140, ... |
| `cmt47r403002glcujrqoixsun` | MCQ | Number Series | MEDIUM | **NEEDS_FIX** | Explanation cites Option B (Index 2), but the correct answer | Determine the missing number in the following sequence:... |
| `cmt47rns7002mlcuj4emqnn71` | MCQ | Number Series | MEDIUM | **NEEDS_FIX** | Explanation cites Option A (Index 1), but the correct answer | Determine the missing number in the sequence: 12, 18, 2... |
| `cmt47ruh0002olcujwuopjsjw` | MCQ | Number Series | MEDIUM | **NEEDS_FIX** | Explanation cites Option A (Index 1), but the correct answer | Determine the missing value in the series: 7, 14, 28, 5... |
| `cmt47s10j002qlcuj8i4uhk67` | MCQ | Number Series | MEDIUM | **NEEDS_FIX** | Explanation cites Option A (Index 1), but the correct answer | Identify the missing number in the sequence: 2, 6, 12, ... |
| `cmt47zzbd003tlcujkn1ciwm9` | MCQ | Number Series | HARD | **NEEDS_FIX** | Explanation cites Option A (Index 1), but the correct answer | Identify the next number in the series: 5, 10, 30, 120,... |
| `cmt4805uu003vlcuj8vlqfbla` | MCQ | Number Series | HARD | **NEEDS_FIX** | Explanation cites Option B (Index 2), but the correct answer | Determine the missing number in the sequence: 3, 9, 19,... |
| `cmt480cj4003xlcujhhyrr74f` | MCQ | Number Series | HARD | **NEEDS_FIX** | Explanation cites Option A (Index 1), but the correct answer | Find the next number in the series: 5, 25, 125, 625, 31... |
| `cmt480j26003zlcujx7tsvck7` | MCQ | Number Series | HARD | **NEEDS_FIX** | Explanation cites Option A (Index 1), but the correct answer | Identify the missing number in the series: 3, 7, 15, 31... |
| `cmt480pqf0041lcujgla8vxqx` | MCQ | Number Series | HARD | **NEEDS_FIX** | Explanation cites Option A (Index 1), but the correct answer | Identify the missing term in the sequence: 3, 9, 20, 42... |
| `cmt480w9e0043lcujkaa0awxv` | MCQ | Number Series | HARD | **NEEDS_FIX** | Explanation cites Option A (Index 1), but the correct answer | Identify the next number in the series: 5, 10, 50, 250,... |
| `cmt4819m70047lcujyews2sme` | MCQ | Number Series | HARD | **NEEDS_FIX** | Explanation cites Option C (Index 3), but the correct answer | Determine the missing number in the sequence: 5, 10, 24... |
| `cmt481mtq004blcujywby7g37` | MCQ | Number Series | HARD | **NEEDS_FIX** | Explanation cites Option C (Index 3), but the correct answer | Identify the missing number in the sequence: 6, 12, 25,... |
| `cmt489w1b0058lcujozo9su5l` | MCQ | Coding-Decoding | HARD | **NEEDS_FIX** | Explanation cites Option B (Index 2), but the correct answer | If the word GRAPE is coded as TIZKV, what is the code f... |
| `cmt48bcxe005qlcujngj13ic7` | MCQ | Coding-Decoding | HARD | **NEEDS_FIX** | Explanation cites Option A (Index 1), but the correct answer | If the code for the word GREEN is represented as TILVM,... |
| `cmt49tpnl001a11pwzsqgchrz` | MCQ | Coding-Decoding | MEDIUM | **NEEDS_FIX** | Explanation cites Option A (Index 1), but the correct answer | If GROW is represented by 61 using the sum of alphabet ... |
| `cmt49ttna001i11pwp7bj0g2z` | MCQ | Coding-Decoding | MEDIUM | **NEEDS_FIX** | Explanation cites Option C (Index 3), but the correct answer | If the code for the word SHIP is determined by adding t... |
| `cmt4a2m76002t11pwhd10385m` | MCQ | Coding-Decoding | EASY | **NEEDS_FIX** | Explanation cites Option A (Index 1), but the correct answer | If HOSPITAL is coded as LATIPSOH, how is OFFICE coded?... |
| `cmt4a2ynr002x11pw2pl9n8zi` | MCQ | Coding-Decoding | EASY | **NEEDS_FIX** | Explanation cites Option A (Index 1), but the correct answer | If RIVER is coded as REVIR, how is MOUNTAIN coded?... |
| `cmt4a3afv003211pwt67vwqzv` | MCQ | Coding-Decoding | EASY | **NEEDS_FIX** | Explanation cites Option D (Index 4), but the correct answer | If CIRCLE is coded as DJSFMD, how is SQUARE coded?... |
| `cmt4a3syi003911pwz0jro8nd` | MCQ | Coding-Decoding | EASY | **NEEDS_FIX** | Explanation cites Option B (Index 2), but the correct answer | If SOPHIE is coded as 19-15-16-8-9-5, how is EMILY code... |
| `cmt4a3ysu003b11pw6hs7i76v` | MCQ | Coding-Decoding | EASY | **NEEDS_FIX** | Explanation cites Option B (Index 2), but the correct answer | In a code, each letter is shifted two positions backwar... |
| `cmt4arez8001te37cmteeib9w` | MCQ | Direction | EASY | **NEEDS_FIX** | Explanation cites Option A (Index 1), but the correct answer | Rajesh travels 7 km north, then turns right and walks 3... |
| `cmt4arlrl0023e37csoh6vdxq` | MCQ | Direction | EASY | **NEEDS_FIX** | Explanation cites Option C (Index 3), but the correct answer | A manager is initially facing east. She turns 90° clock... |
| `cmt4awsvn0036e37cfl7pt27z` | MCQ | Direction | MEDIUM | **NEEDS_FIX** | Explanation cites Option C (Index 3), but the correct answer | A woman is initially facing south. After making a 90° c... |
| `cmt4awwdp0038e37cdnm066mn` | MCQ | Direction | MEDIUM | **NEEDS_FIX** | Explanation cites Option C (Index 3), but the correct answer | A vehicle is initially heading east. It makes a right t... |
| `cmt4awxuj003ae37cmkqur2qs` | MCQ | Direction | MEDIUM | **NEEDS_FIX** | Explanation cites Option A (Index 1), but the correct answer | An engineer is initially facing east. After turning 180... |
| `cmt4ax4f0003ke37cfjzn3eg9` | MCQ | Direction | MEDIUM | **NEEDS_FIX** | Explanation cites Option B (Index 2), but the correct answer | An individual walks 10 m west, then 15 m north, followe... |
| `cmt4ax7n2003oe37conup5ooi` | MCQ | Direction | MEDIUM | **NEEDS_FIX** | Explanation cites Option C (Index 3), but the correct answer | A cyclist rides 15 meters north, then makes a right tur... |
| `cmt4b6jkb006ie37cl758o9g3` | MCQ | Syllogisms | EASY | **NEEDS_FIX** | Explanation cites Option B (Index 2), but the correct answer | **Statements:** - All engineers are professionals. - So... |
| `cmt4bac6f007fe37ccya5uxzu` | MCQ | Syllogisms | MEDIUM | **NEEDS_FIX** | Explanation cites Option A (Index 1), but the correct answer | **Statements:** - No cats are reptiles. - All tabbies a... |
| `cmt4bal6k007re37cyngpgw5j` | MCQ | Syllogisms | MEDIUM | **NEEDS_FIX** | Explanation cites Option A (Index 1), but the correct answer | **Statements:** - All fruits are plants. - No plants ar... |
| `cmt4bapzb007xe37ctr82ua1e` | MCQ | Syllogisms | MEDIUM | **NEEDS_FIX** | Explanation cites Option C (Index 3), but the correct answer | In a company, some employees are team leaders. Some tea... |
| `cmt4bdw61008ue37cwzkro77m` | MCQ | Syllogisms | HARD | **NEEDS_FIX** | Explanation cites Option C (Index 3), but the correct answer | **Statements:** - No birds are reptiles. - Some reptile... |
| `cmt4bjfmk00ahe37c0uq7f7b5` | MCQ | Data Sufficiency | EASY | **NEEDS_FIX** | Explanation cites Option D (Index 4), but the correct answer | Is X+Y less than 30?   **Statement I:** X=15.   **State... |
| `cmt4bmyr000bke37cmd8xs95o` | MCQ | Data Sufficiency | MEDIUM | **NEEDS_FIX** | Explanation cites Option A (Index 1), but the correct answer | What is the total length of the boundary of a rectangle... |
| `cmt4bn57e00bue37cgkijttzz` | MCQ | Data Sufficiency | MEDIUM | **NEEDS_FIX** | Explanation cites Option C (Index 3), but the correct answer | What is the value of y?   **Statement I:** y is an even... |
| `cmt6rkufo00125o193p32r16s` | MCQ | Puzzles | EASY | **NEEDS_FIX** | Explanation cites Option D (Index 4), but the correct answer | In a building, there are four departments: A, B, C, and... |
| `cmt6rqnjv002d5o19v5uh7b1a` | MCQ | Puzzles | MEDIUM | **NEEDS_FIX** | Explanation cites Option A (Index 1), but the correct answer | In a team of five professionals, A, B, C, D, and E have... |
| `cmt6rqquc002h5o19bcojgxsl` | MCQ | Puzzles | MEDIUM | **NEEDS_FIX** | Explanation cites Option A (Index 1), but the correct answer | In a team of five individuals, A, B, C, D, and E, each ... |
| `cmt6rqsdb002j5o19i5qq0e6r` | MCQ | Puzzles | MEDIUM | **NEEDS_FIX** | Explanation cites Option A (Index 1), but the correct answer | In a warehouse, there are five crates containing differ... |
| `cmt6rqvj2002n5o1909it53fb` | MCQ | Puzzles | MEDIUM | **NEEDS_FIX** | Explanation cites Option A (Index 1), but the correct answer | In a factory, there are five storage containers with di... |
| `cmt6rr042002t5o196imm2355` | MCQ | Puzzles | MEDIUM | **NEEDS_FIX** | Explanation cites Option A (Index 1), but the correct answer | In a factory, there are five machines that produce diff... |
| `cmt6s0ut000425o19c58g18sf` | MCQ | Puzzles | HARD | **NEEDS_FIX** | Explanation cites Option D (Index 4), but the correct answer | In a project team, five members: X, Y, Z, W, and V each... |
| `cmt6v57kg003yxojmv1y0jh96` | MCQ | Reading Comprehension | EASY | **NEEDS_FIX** | Explanation cites Option A (Index 1), but the correct answer | A company decided to extend its office hours during wee... |
| `cmt6vjk0v00056ggumg5kthl7` | MCQ | Sentence Arrangement | MEDIUM | **NEEDS_FIX** | Explanation cites Option A (Index 1), but the correct answer | Arrange the given phrases in the correct order to form ... |
| `cmt6wk34w0033xysm2eeev2zu` | MCQ | Sitting Arrangements | HARD | **NEEDS_FIX** | Explanation cites Option C (Index 3), but the correct answer | In a row of eight professionals labeled A, B, C, D, E, ... |
| `cmt6xtnvq0016ruubkb9s4mqs` | MCQ | Para Jumbled | EASY | **NEEDS_FIX** | Explanation cites Option A (Index 1), but the correct answer | Arrange the following jumbled sentences in the correct ... |
| `cmt73q5g7000ynhvbkmz6kms1` | MCQ | Para Jumbled | HARD | **NEEDS_FIX** | Explanation cites Option A (Index 1), but the correct answer | Rearrange the following statements into a coherent and ... |
| `cmt73qajw0014nhvb66db37y8` | MCQ | Para Jumbled | HARD | **NEEDS_FIX** | Explanation cites Option A (Index 1), but the correct answer | Rearrange the following statements into a coherent and ... |
| `cmt73qe6c0018nhvb1dus89si` | MCQ | Para Jumbled | HARD | **NEEDS_FIX** | Explanation cites Option A (Index 1), but the correct answer | Rearrange the following statements into a coherent and ... |
| `cmt73qw12001unhvbziekspo6` | MCQ | Para Jumbled | MEDIUM | **NEEDS_FIX** | Explanation cites Option A (Index 1), but the correct answer | Rearrange the following statements in the correct logic... |
| `cmt73r2zl001ynhvb5g7qw34l` | MCQ | Para Jumbled | MEDIUM | **NEEDS_FIX** | Explanation cites Option A (Index 1), but the correct answer | Organize the following statements to form a coherent se... |
| `cmt73r84e0024nhvbmhbbh0i9` | MCQ | Para Jumbled | MEDIUM | **NEEDS_FIX** | Explanation cites Option A (Index 1), but the correct answer | Rearrange the following statements to create a logical ... |
| `cmt73r9og0026nhvb5rkglyc6` | MCQ | Para Jumbled | MEDIUM | **NEEDS_FIX** | Explanation cites Option A (Index 1), but the correct answer | Rearrange the following statements into a logical seque... |
| `cmt73xi04000113v7s7rauwi6` | MCQ | Para Jumbled | MEDIUM | **NEEDS_FIX** | Explanation cites Option A (Index 1), but the correct answer | Arrange the following statements in the correct logical... |
