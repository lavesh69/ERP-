import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const BIOLOGY_COURSES = [
  // Tier 1: Foundational Biology
  {
    code: "BIO-101",
    title: "General Biology & Principles of Life",
    shortName: "General Biology",
    description: "Fundamental concepts of biological systems, unity and diversity of life, cellular basis of heredity, and evolutionary mechanisms.",
    subjectType: "CORE",
    courseType: "THEORY",
    credits: 4,
    lectureHours: 3,
    tutorialHours: 1,
    labHours: 0,
    internalMarks: 40,
    externalMarks: 60,
    isElective: false,
    facultyId: "fac-raman-02",
  },
  {
    code: "BIO-101L",
    title: "General Biology & Optical Microscopy Lab",
    shortName: "General Bio Lab",
    description: "Microscopic analysis of eukaryotic and prokaryotic cells, vital staining, mitosis observation, and specimen preparation.",
    subjectType: "LAB",
    courseType: "PRACTICAL",
    credits: 2,
    lectureHours: 0,
    tutorialHours: 0,
    labHours: 4,
    internalMarks: 50,
    externalMarks: 50,
    isElective: false,
    facultyId: "fac-raman-02",
  },
  {
    code: "BIO-102",
    title: "Evolutionary Biology & Population Ecology",
    shortName: "Evolution & Ecology",
    description: "Darwinian selection, modern synthesis, speciation modes, Hardy-Weinberg equilibrium, phylogenetic tree modeling, and adaptive radiation.",
    subjectType: "CORE",
    courseType: "THEORY",
    credits: 3,
    lectureHours: 3,
    tutorialHours: 0,
    labHours: 0,
    internalMarks: 40,
    externalMarks: 60,
    isElective: false,
    facultyId: "fac-raman-02",
  },
  {
    code: "BIO-103",
    title: "Botany: Plant Anatomy, Taxonomy & Physiology",
    shortName: "Plant Biology",
    description: "Angiosperm and gymnosperm morphology, plant tissue systems, photosynthetic light and dark reactions (C3/C4/CAM), and phytohormone signaling.",
    subjectType: "CORE",
    courseType: "THEORY",
    credits: 4,
    lectureHours: 3,
    tutorialHours: 1,
    labHours: 0,
    internalMarks: 40,
    externalMarks: 60,
    isElective: false,
    facultyId: "fac-raman-02",
  },
  {
    code: "BIO-103L",
    title: "Plant Physiology & Botanical Specimen Lab",
    shortName: "Botany Lab",
    description: "Stomatal index determination, paper chromatography of photosynthetic pigments, transpiration measurement, and plant anatomical sectioning.",
    subjectType: "LAB",
    courseType: "PRACTICAL",
    credits: 2,
    lectureHours: 0,
    tutorialHours: 0,
    labHours: 4,
    internalMarks: 50,
    externalMarks: 50,
    isElective: false,
    facultyId: "fac-raman-02",
  },
  {
    code: "BIO-104",
    title: "Zoology: Animal Diversity, Physiology & Histology",
    shortName: "Animal Biology",
    description: "Invertebrate and vertebrate taxonomy, comparative organ systems, homeostatic mechanisms, and mammalian tissue histology.",
    subjectType: "CORE",
    courseType: "THEORY",
    credits: 4,
    lectureHours: 3,
    tutorialHours: 1,
    labHours: 0,
    internalMarks: 40,
    externalMarks: 60,
    isElective: false,
    facultyId: "fac-raman-02",
  },
  {
    code: "BIO-104L",
    title: "Comparative Animal Anatomy & Dissection Lab",
    shortName: "Zoology Lab",
    description: "Histological slide examination, dissection of representative animal organ models, blood smear staining, and hemolymph observation.",
    subjectType: "LAB",
    courseType: "PRACTICAL",
    credits: 2,
    lectureHours: 0,
    tutorialHours: 0,
    labHours: 4,
    internalMarks: 50,
    externalMarks: 50,
    isElective: false,
    facultyId: "fac-raman-02",
  },

  // Tier 2: Cellular, Molecular & Genetics
  {
    code: "BIO-201",
    title: "Cell Biology & Cytoskeleton Dynamics",
    shortName: "Cell Biology",
    description: "Membrane transport mechanisms, nuclear pore complex, protein targeting to ER and Golgi, actin-myosin cytoskeleton, and apoptosis pathways.",
    subjectType: "CORE",
    courseType: "THEORY",
    credits: 4,
    lectureHours: 3,
    tutorialHours: 1,
    labHours: 0,
    internalMarks: 40,
    externalMarks: 60,
    isElective: false,
    facultyId: "fac-raman-02",
  },
  {
    code: "BIO-201L",
    title: "Cell Biology & Fluorescence Microscopy Lab",
    shortName: "Cell Bio Lab",
    description: "Cell fractionation by differential centrifugation, organelle marker assays, cell viability assays (Trypan Blue/MTT), and fluorescence imaging.",
    subjectType: "LAB",
    courseType: "PRACTICAL",
    credits: 2,
    lectureHours: 0,
    tutorialHours: 0,
    labHours: 4,
    internalMarks: 50,
    externalMarks: 50,
    isElective: false,
    facultyId: "fac-raman-02",
  },
  {
    code: "BIO-202",
    title: "Molecular Genetics & Chromosome Architecture",
    shortName: "Molecular Genetics",
    description: "Chromosome packaging, telomeres, nucleosome positioning, homologous recombination, DNA repair mechanisms, and linkage mapping.",
    subjectType: "CORE",
    courseType: "THEORY",
    credits: 4,
    lectureHours: 3,
    tutorialHours: 1,
    labHours: 0,
    internalMarks: 40,
    externalMarks: 60,
    isElective: false,
    facultyId: "fac-raman-02",
  },
  {
    code: "BIO-203",
    title: "Structural Biochemistry & Enzymology",
    shortName: "Biochemistry",
    description: "Protein quaternary folding, Michaelis-Menten enzyme kinetics, allosteric regulation, lineweaver-burk transformations, and lipid bilayers.",
    subjectType: "CORE",
    courseType: "THEORY",
    credits: 4,
    lectureHours: 3,
    tutorialHours: 0,
    labHours: 2,
    internalMarks: 40,
    externalMarks: 60,
    isElective: false,
    facultyId: "fac-raman-02",
  },
  {
    code: "BIO-203L",
    title: "Biochemical Analysis & Chromatography Lab",
    shortName: "Biochem Lab",
    description: "Protein quantitation by Bradford and Lowry assays, enzyme activity assays (amylase/catalase), and thin-layer chromatography (TLC).",
    subjectType: "LAB",
    courseType: "PRACTICAL",
    credits: 2,
    lectureHours: 0,
    tutorialHours: 0,
    labHours: 4,
    internalMarks: 50,
    externalMarks: 50,
    isElective: false,
    facultyId: "fac-raman-02",
  },
  {
    code: "BIO-204",
    title: "Biophysics & Bioenergetics",
    shortName: "Biophysics",
    description: "Thermodynamics of biological reactions, Gibbs free energy in metabolic coupling, electrochemical proton gradients, and membrane action potentials.",
    subjectType: "CORE",
    courseType: "THEORY",
    credits: 3,
    lectureHours: 3,
    tutorialHours: 0,
    labHours: 0,
    internalMarks: 40,
    externalMarks: 60,
    isElective: false,
    facultyId: "fac-raman-02",
  },
  {
    code: "BIO-205",
    title: "Developmental Biology & Morphogenesis",
    shortName: "Dev Biology",
    description: "Embryonic cleavage patterns, gastrulation, neural tube formation, Homeobox (Hox) patterning genes, and cell fate specification.",
    subjectType: "CORE",
    courseType: "THEORY",
    credits: 3,
    lectureHours: 3,
    tutorialHours: 0,
    labHours: 0,
    internalMarks: 40,
    externalMarks: 60,
    isElective: false,
    facultyId: "fac-raman-02",
  },
  {
    code: "BIO-220",
    title: "Ecology & Biosphere Conservation",
    shortName: "Ecology",
    description: "Biogeochemical cycles (nitrogen, phosphorus, carbon), trophic cascade dynamics, niche partitioning, and ecosystem resilience under climate pressure.",
    subjectType: "CORE",
    courseType: "THEORY",
    credits: 3,
    lectureHours: 3,
    tutorialHours: 0,
    labHours: 0,
    internalMarks: 40,
    externalMarks: 60,
    isElective: false,
    facultyId: "fac-raman-02",
  },

  // Tier 3: Applied Biotechnology, Immunology & Health
  {
    code: "BIO-310",
    title: "Immunology & Serological Diagnostics",
    shortName: "Immunology",
    description: "Innate vs adaptive immunity, V(D)J genetic recombination, major histocompatibility complex (MHC I/II) presentation, and monoclonal antibodies.",
    subjectType: "CORE",
    courseType: "THEORY",
    credits: 4,
    lectureHours: 3,
    tutorialHours: 1,
    labHours: 0,
    internalMarks: 40,
    externalMarks: 60,
    isElective: false,
    facultyId: "fac-sharma-05",
  },
  {
    code: "BIO-310L",
    title: "Immunology, ELISA & Flow Cytometry Lab",
    shortName: "Immuno Lab",
    description: "Enzyme-linked immunosorbent assay (ELISA), agglutination tests, radial immunodiffusion, and leukocyte differential counting.",
    subjectType: "LAB",
    courseType: "PRACTICAL",
    credits: 2,
    lectureHours: 0,
    tutorialHours: 0,
    labHours: 4,
    internalMarks: 50,
    externalMarks: 50,
    isElective: false,
    facultyId: "fac-sharma-05",
  },
  {
    code: "BIO-320",
    title: "Plant Tissue Culture & Agrobacterium Transformation",
    shortName: "Plant Biotech",
    description: "Micropropagation protocols, callus induction, somatic embryogenesis, Agrobacterium tumefaciens binary vectors, and transgenic crop generation.",
    subjectType: "PROGRAM_ELECTIVE",
    courseType: "THEORY",
    credits: 3,
    lectureHours: 3,
    tutorialHours: 0,
    labHours: 0,
    internalMarks: 40,
    externalMarks: 60,
    isElective: true,
    facultyId: "fac-raman-02",
  },
  {
    code: "BIO-325",
    title: "Marine Biology & Ocean Ecosystem Dynamics",
    shortName: "Marine Biology",
    description: "Pelagic and benthic marine communities, coral reef bleaching, deep-sea hydrothermal vent extremophiles, and marine biotechnology.",
    subjectType: "OPEN_ELECTIVE",
    courseType: "THEORY",
    credits: 3,
    lectureHours: 3,
    tutorialHours: 0,
    labHours: 0,
    internalMarks: 40,
    externalMarks: 60,
    isElective: true,
    facultyId: "fac-raman-02",
  },
  {
    code: "BIO-330",
    title: "Animal Cell Culture & Regenerative Stem Cell Biology",
    shortName: "Animal Biotech",
    description: "Primary cell isolation, immortalization, induced pluripotent stem cells (iPSCs), 3D organoid cultures, and cell therapy engineering.",
    subjectType: "PROGRAM_ELECTIVE",
    courseType: "THEORY",
    credits: 3,
    lectureHours: 3,
    tutorialHours: 0,
    labHours: 0,
    internalMarks: 40,
    externalMarks: 60,
    isElective: true,
    facultyId: "fac-sharma-05",
  },
  {
    code: "BIO-340",
    title: "Bioprocess Engineering & Fermentation Technology",
    shortName: "Bioprocess Eng",
    description: "Stirred-tank bioreactor design, aeration and mass transfer (kLa), batch vs continuous culture kinetics, downstream cell disruption, and chromatography.",
    subjectType: "CORE",
    courseType: "THEORY",
    credits: 4,
    lectureHours: 3,
    tutorialHours: 0,
    labHours: 2,
    internalMarks: 40,
    externalMarks: 60,
    isElective: false,
    facultyId: "fac-sharma-05",
  },
  {
    code: "BIO-360",
    title: "Proteomics, Mass Spectrometry & Protein Engineering",
    shortName: "Proteomics",
    description: "MALDI-TOF and LC-MS/MS peptide mass fingerprinting, 2D gel electrophoresis, rational enzyme design, and directed evolution.",
    subjectType: "PROGRAM_ELECTIVE",
    courseType: "THEORY",
    credits: 3,
    lectureHours: 3,
    tutorialHours: 0,
    labHours: 0,
    internalMarks: 40,
    externalMarks: 60,
    isElective: true,
    facultyId: "fac-raman-02",
  },
  {
    code: "BIO-370",
    title: "Human Anatomy & Systems Physiology",
    shortName: "Human Physiology",
    description: "Cardiovascular, pulmonary, renal, and gastrointestinal physiological regulation, autonomic nervous system, and acid-base blood buffer balance.",
    subjectType: "CORE",
    courseType: "THEORY",
    credits: 4,
    lectureHours: 3,
    tutorialHours: 1,
    labHours: 0,
    internalMarks: 40,
    externalMarks: 60,
    isElective: false,
    facultyId: "fac-raman-02",
  },
  {
    code: "BIO-370L",
    title: "Human Physiology & Electrocardiography Lab",
    shortName: "Physiology Lab",
    description: "Electrocardiogram (ECG) recording, spirometry lung volume measurements, blood pressure auscultation, and reflex arc testing.",
    subjectType: "LAB",
    courseType: "PRACTICAL",
    credits: 2,
    lectureHours: 0,
    tutorialHours: 0,
    labHours: 4,
    internalMarks: 50,
    externalMarks: 50,
    isElective: false,
    facultyId: "fac-raman-02",
  },
  {
    code: "BIO-380",
    title: "Neurobiology, Synaptic Signaling & Brain Function",
    shortName: "Neurobiology",
    description: "Ion channel electrophysiology, patch clamping, neurotransmitter release kinetics, synaptic plasticity (LTP/LTD), and neurodegenerative pathologies.",
    subjectType: "PROGRAM_ELECTIVE",
    courseType: "THEORY",
    credits: 3,
    lectureHours: 3,
    tutorialHours: 0,
    labHours: 0,
    internalMarks: 40,
    externalMarks: 60,
    isElective: true,
    facultyId: "fac-raman-02",
  },
  {
    code: "BIO-390",
    title: "Cancer Biology & Targeted Molecular Oncology",
    shortName: "Cancer Biology",
    description: "Hallmarks of cancer, oncogenes, tumor suppressor p53, receptor tyrosine kinase signaling (EGFR/HER2), metastasis cascade, and CAR-T immunotherapy.",
    subjectType: "PROGRAM_ELECTIVE",
    courseType: "THEORY",
    credits: 3,
    lectureHours: 3,
    tutorialHours: 0,
    labHours: 0,
    internalMarks: 40,
    externalMarks: 60,
    isElective: true,
    facultyId: "fac-raman-02",
  },

  // Tier 4: Microbiology Specialty
  {
    code: "MIC-201",
    title: "General Microbiology & Microbial Taxonomy",
    shortName: "Microbiology",
    description: "Bacterial cell wall ultra-structure (Gram-positive/negative), archaea extremophiles, viral lytic/lysogenic cycles, and microbial growth mathematics.",
    subjectType: "CORE",
    courseType: "THEORY",
    credits: 4,
    lectureHours: 3,
    tutorialHours: 0,
    labHours: 2,
    internalMarks: 40,
    externalMarks: 60,
    isElective: false,
    facultyId: "fac-sharma-05",
  },
  {
    code: "MIC-201L",
    title: "Microbial Culturing & Gram Staining Laboratory",
    shortName: "Micro Lab",
    description: "Aseptic streak-plate technique, Gram staining, endospore staining, autoclave sterilization verification, and viable plate counting.",
    subjectType: "LAB",
    courseType: "PRACTICAL",
    credits: 2,
    lectureHours: 0,
    tutorialHours: 0,
    labHours: 4,
    internalMarks: 50,
    externalMarks: 50,
    isElective: false,
    facultyId: "fac-sharma-05",
  },
  {
    code: "MIC-301",
    title: "Medical Bacteriology & Antimicrobial Resistance",
    shortName: "Medical Bacteriology",
    description: "Pathogenic mechanisms of Staphylococcus, Mycobacterium tuberculosis, enterobacteria, and molecular mechanisms of beta-lactamase and carbapenemase resistance.",
    subjectType: "CORE",
    courseType: "THEORY",
    credits: 4,
    lectureHours: 3,
    tutorialHours: 1,
    labHours: 0,
    internalMarks: 40,
    externalMarks: 60,
    isElective: false,
    facultyId: "fac-sharma-05",
  },
  {
    code: "MIC-302",
    title: "Virology & Pathogen Host Interactions",
    shortName: "Virology",
    description: "Viral classification (Baltimore scheme), RNA/DNA replication strategies of SARS-CoV-2, HIV, Influenza, and host antiviral interferon responses.",
    subjectType: "CORE",
    courseType: "THEORY",
    credits: 3,
    lectureHours: 3,
    tutorialHours: 0,
    labHours: 0,
    internalMarks: 40,
    externalMarks: 60,
    isElective: false,
    facultyId: "fac-sharma-05",
  },
  {
    code: "MIC-303",
    title: "Medical Mycology & Parasitology",
    shortName: "Mycology & Parasitology",
    description: "Clinical pathology of Candida, Aspergillus, dermatophytes, protozoan life cycles (Plasmodium, Entamoeba), and anti-parasitic pharmacology.",
    subjectType: "CORE",
    courseType: "THEORY",
    credits: 3,
    lectureHours: 3,
    tutorialHours: 0,
    labHours: 0,
    internalMarks: 40,
    externalMarks: 60,
    isElective: false,
    facultyId: "fac-sharma-05",
  },
  {
    code: "MIC-401",
    title: "Environmental Microbiology & Bioremediation",
    shortName: "Env Microbiology",
    description: "Microbial biodegradation of xenobiotic pollutants, hydrocarbon bioremediation, wastewater treatment bio-digesters, and bioleaching of metals.",
    subjectType: "PROGRAM_ELECTIVE",
    courseType: "THEORY",
    credits: 3,
    lectureHours: 3,
    tutorialHours: 0,
    labHours: 0,
    internalMarks: 40,
    externalMarks: 60,
    isElective: true,
    facultyId: "fac-sharma-05",
  },
  {
    code: "MIC-402",
    title: "Food, Dairy & Agricultural Microbiology",
    shortName: "Food Microbiology",
    description: "Probiotic fermentation, foodborne pathogens (Salmonella, Listeria), Hazard Analysis Critical Control Points (HACCP), and Rhizobium biofertilizers.",
    subjectType: "PROGRAM_ELECTIVE",
    courseType: "THEORY",
    credits: 3,
    lectureHours: 3,
    tutorialHours: 0,
    labHours: 0,
    internalMarks: 40,
    externalMarks: 60,
    isElective: true,
    facultyId: "fac-sharma-05",
  },

  // Tier 5: Modern Frontiers, CRISPR, Synthetic Genomes & Capstone
  {
    code: "BIO-425",
    title: "Conservation Genetics & Wildlife Forensics",
    shortName: "Wildlife Genetics",
    description: "Mitochondrial DNA barcoding for endangered species, microsatellite markers, inbreeding depression mitigation, and CITES anti-poaching tracking.",
    subjectType: "VALUE_ADDED",
    courseType: "THEORY",
    credits: 3,
    lectureHours: 3,
    tutorialHours: 0,
    labHours: 0,
    internalMarks: 40,
    externalMarks: 60,
    isElective: true,
    facultyId: "fac-raman-02",
  },
  {
    code: "BIO-435",
    title: "Toxicology & Environmental Endocrine Disruptors",
    shortName: "Toxicology",
    description: "Dose-response curves (LD50/IC50), hepatic cytochrome P450 xenobiotic bio-transformation, microplastic toxicity, and bisphenol endocrine mimicry.",
    subjectType: "PROGRAM_ELECTIVE",
    courseType: "THEORY",
    credits: 3,
    lectureHours: 3,
    tutorialHours: 0,
    labHours: 0,
    internalMarks: 40,
    externalMarks: 60,
    isElective: true,
    facultyId: "fac-sharma-05",
  },
  {
    code: "BIO-440",
    title: "CRISPR Gene Editing & Synthetic Biology",
    shortName: "CRISPR & Synthetic Bio",
    description: "Cas9, Cas12, Cas13 guide RNA targeting, base editing, prime editing, minimal synthetic bacterial genomes, and genetic biocontainment switches.",
    subjectType: "PROGRAM_ELECTIVE",
    courseType: "THEORY",
    credits: 4,
    lectureHours: 3,
    tutorialHours: 1,
    labHours: 0,
    internalMarks: 40,
    externalMarks: 60,
    isElective: true,
    facultyId: "fac-raman-02",
  },
  {
    code: "BIO-440L",
    title: "CRISPR-Cas9 Target Cleavage & Gene Editing Lab",
    shortName: "CRISPR Lab",
    description: "In vitro sgRNA transcription, recombinant Cas9 endonuclease cleavage assay, transformation into E. coli, and blue-white colony screening.",
    subjectType: "LAB",
    courseType: "PRACTICAL",
    credits: 2,
    lectureHours: 0,
    tutorialHours: 0,
    labHours: 4,
    internalMarks: 50,
    externalMarks: 50,
    isElective: true,
    facultyId: "fac-raman-02",
  },
  {
    code: "BIO-450",
    title: "Bioethics, Clinical Trials, Biosafety & IPR",
    shortName: "Bioethics & IPR",
    description: "Helsinki declaration, Institutional Biosafety Committee (IBS) protocols, GMO regulatory compliance, FDA phase I-IV trials, and gene patenting.",
    subjectType: "ABILITY_ENHANCEMENT",
    courseType: "THEORY",
    credits: 2,
    lectureHours: 2,
    tutorialHours: 0,
    labHours: 0,
    internalMarks: 50,
    externalMarks: 50,
    isElective: false,
    facultyId: "fac-raman-02",
  },
  {
    code: "BIO-460",
    title: "Nanobiotechnology & Optical Biosensors",
    shortName: "Nanobiotechnology",
    description: "Surface plasmon resonance (SPR), gold nanoparticle antibody conjugates, quantum dot biolabeling, and microfluidic lab-on-a-chip diagnostics.",
    subjectType: "PROGRAM_ELECTIVE",
    courseType: "THEORY",
    credits: 3,
    lectureHours: 3,
    tutorialHours: 0,
    labHours: 0,
    internalMarks: 40,
    externalMarks: 60,
    isElective: true,
    facultyId: "fac-raman-02",
  },
  {
    code: "BIO-470",
    title: "Pharmacogenomics & Precision Medicine",
    shortName: "Pharmacogenomics",
    description: "Single nucleotide polymorphisms (SNPs) in drug metabolism, CYP2D6/CYP2C19 polymorphisms, companion diagnostic biomarkers, and tailored chemotherapy.",
    subjectType: "PROGRAM_ELECTIVE",
    courseType: "THEORY",
    credits: 3,
    lectureHours: 3,
    tutorialHours: 0,
    labHours: 0,
    internalMarks: 40,
    externalMarks: 60,
    isElective: true,
    facultyId: "fac-raman-02",
  },
  {
    code: "BIO-480",
    title: "Single-Cell RNA Sequencing & Spatial Transcriptomics",
    shortName: "Spatial Transcriptomics",
    description: "Microfluidic single-cell partitioning (10x Genomics), UMI barcoding, Seurat dimensional reduction (UMAP/t-SNE), and tissue spatial gene mapping.",
    subjectType: "PROGRAM_ELECTIVE",
    courseType: "THEORY",
    credits: 4,
    lectureHours: 3,
    tutorialHours: 1,
    labHours: 0,
    internalMarks: 40,
    externalMarks: 60,
    isElective: true,
    facultyId: "fac-raman-02",
  },
  {
    code: "BIO-490",
    title: "Senior Capstone Thesis & Research Dissertation in Biology",
    shortName: "Biology Capstone",
    description: "Independent laboratory research investigation under faculty mentorship culminating in an ISO/peer-review standard thesis submission and public defense.",
    subjectType: "PROJECT",
    courseType: "PRACTICAL",
    credits: 6,
    lectureHours: 0,
    tutorialHours: 2,
    labHours: 8,
    internalMarks: 100,
    externalMarks: 100,
    isElective: false,
    facultyId: "fac-raman-02",
  },
];

async function seedBiologyCourses() {
  console.log("🌱 Starting Biology & Life Sciences Curriculum Ingestion...");

  const deptBio = await prisma.department.findFirst({
    where: { code: "BIO" },
  });
  if (!deptBio) {
    throw new Error("Biotechnology & Genomics department not found");
  }

  const progBio = await prisma.program.findFirst({
    where: { code: "BSC-BIO" },
  });
  if (!progBio) {
    throw new Error("BSC-BIO program not found");
  }

  const ayCurrent = await prisma.academicYear.findFirst({
    where: { isCurrent: true },
  });
  if (!ayCurrent) {
    throw new Error("Active academic year not found");
  }

  // Ensure Biology Semesters exist
  const bioSemesters = [
    { id: "sem-bio-sem1-2026", number: 1, title: "Fall 2026 (Semester I - Foundational)" },
    { id: "sem-bio-fall-2026", number: 3, title: "Fall 2026 (Semester III - Intermediate)" },
    { id: "sem-bio-sem5-2026", number: 5, title: "Fall 2026 (Semester V - Advanced)" },
  ];

  const semesterMap = {};
  for (const semData of bioSemesters) {
    let sem = await prisma.semester.findFirst({
      where: { programId: progBio.id, academicYearId: ayCurrent.id, semesterNumber: semData.number },
    });
    if (!sem) {
      sem = await prisma.semester.create({
        data: {
          id: semData.id,
          programId: progBio.id,
          academicYearId: ayCurrent.id,
          semesterNumber: semData.number,
          title: semData.title,
          startDate: new Date("2026-08-15"),
          endDate: new Date("2026-12-20"),
          isCurrent: true,
        },
      });
    }
    semesterMap[semData.number] = sem.id;
  }

  // Ensure Dr. Rajesh Sharma has faculty profile
  let sharmaUser = await prisma.user.findUnique({
    where: { email: "faculty.sharma@apex.edu" },
  });
  let facSharma = null;
  if (sharmaUser) {
    facSharma = await prisma.faculty.findUnique({
      where: { userId: sharmaUser.id },
    });
    if (!facSharma) {
      facSharma = await prisma.faculty.create({
        data: {
          id: "fac-sharma-05",
          userId: sharmaUser.id,
          departmentId: deptBio.id,
          employeeCode: "FAC-BIO-205",
          designation: "Associate Professor",
          specialization: "Microbiology, Molecular Virology & Antimicrobial Resistance",
          weeklyHours: 18,
          joiningDate: new Date("2022-01-15"),
        },
      });
      console.log("✅ Created faculty profile for Dr. Rajesh Sharma in Biology");
    }
  }

  const facRaman = await prisma.faculty.findFirst({
    where: { employeeCode: "FAC-BIO-204" },
  });

  let createdCount = 0;
  let updatedCount = 0;

  for (const c of BIOLOGY_COURSES) {
    // Determine semester by course code level
    let semId = semesterMap[3];
    if (c.code.startsWith("BIO-1") || c.code.startsWith("MIC-1")) {
      semId = semesterMap[1] || semesterMap[3];
    } else if (c.code.startsWith("BIO-4") || c.code.startsWith("MIC-4")) {
      semId = semesterMap[5] || semesterMap[3];
    }

    const existing = await prisma.course.findFirst({
      where: { departmentId: deptBio.id, code: c.code },
    });

    let courseRecord = null;
    if (existing) {
      courseRecord = await prisma.course.update({
        where: { id: existing.id },
        data: {
          title: c.title,
          shortName: c.shortName,
          description: c.description,
          subjectType: c.subjectType,
          courseType: c.courseType,
          credits: c.credits,
          lectureHours: c.lectureHours,
          tutorialHours: c.tutorialHours,
          labHours: c.labHours,
          internalMarks: c.internalMarks,
          externalMarks: c.externalMarks,
          totalMarks: 100,
          passingMarks: 40,
          status: "ACTIVE",
          isElective: c.isElective,
          isActive: true,
        },
      });
      updatedCount++;
    } else {
      courseRecord = await prisma.course.create({
        data: {
          id: `crs-${c.code.toLowerCase().replace(/[^a-z0-9]/g, "")}`,
          departmentId: deptBio.id,
          semesterId: semId,
          code: c.code,
          title: c.title,
          shortName: c.shortName,
          description: c.description,
          subjectType: c.subjectType,
          courseType: c.courseType,
          credits: c.credits,
          lectureHours: c.lectureHours,
          tutorialHours: c.tutorialHours,
          labHours: c.labHours,
          internalMarks: c.internalMarks,
          externalMarks: c.externalMarks,
          totalMarks: 100,
          passingMarks: 40,
          status: "ACTIVE",
          isElective: c.isElective,
          isCommon: false,
          isActive: true,
        },
      });
      createdCount++;
    }

    // Link Faculty
    const assignedFac = (c.facultyId === "fac-sharma-05" && facSharma) ? facSharma.id : (facRaman?.id || facSharma?.id);
    if (assignedFac && courseRecord) {
      await prisma.courseFaculty.upsert({
        where: { courseId_facultyId: { courseId: courseRecord.id, facultyId: assignedFac } },
        update: { role: "PRIMARY_INSTRUCTOR" },
        create: {
          courseId: courseRecord.id,
          facultyId: assignedFac,
          role: "PRIMARY_INSTRUCTOR",
        },
      });
    }

    // Ensure sample Course Modules for LMS
    const existingModule = await prisma.courseModule.findFirst({
      where: { courseId: courseRecord.id },
    });
    if (!existingModule) {
      const module1 = await prisma.courseModule.create({
        data: {
          courseId: courseRecord.id,
          title: `Unit 1: Foundations & Core Mechanisms of ${c.shortName || c.code}`,
          orderIndex: 1,
          description: `Comprehensive foundational theoretical modules and experimental methodologies in ${c.title}.`,
          progressPercent: 35.0,
          learningObjectives: `Master key principles, biological nomenclature, laboratory techniques, and clinical/industrial applications.`,
          courseOutcomes: `Analyze experimental data, synthesize biological pathways, and execute verified scientific methodologies.`,
        },
      });

      await prisma.courseChapter.createMany({
        data: [
          {
            moduleId: module1.id,
            title: `Chapter 1.1: Historical Evolution & Modern Experimental Paradigm`,
            orderIndex: 1,
            contentType: "TEXT",
            textContent: `Overview of experimental milestones, discovery kinetics, and foundational models in ${c.title}.`,
            durationMins: 45,
            isPublished: true,
          },
          {
            moduleId: module1.id,
            title: `Chapter 1.2: Molecular Mechanisms & Structural Architecture`,
            orderIndex: 2,
            contentType: "VIDEO",
            contentUrl: "https://classroom.apex.edu/lectures/bio-foundations-stream.mp4",
            durationMins: 60,
            isPublished: true,
          },
          {
            moduleId: module1.id,
            title: `Chapter 1.3: Diagnostic Methodologies & Practical Bench Protocols`,
            orderIndex: 3,
            contentType: "PDF",
            contentUrl: "https://classroom.apex.edu/docs/bench-protocols-standard.pdf",
            durationMins: 50,
            isPublished: true,
          },
        ],
      });
    }
  }

  // Also enroll Maya Patel & Alex Mercer in key new biology courses
  const studentMaya = await prisma.student.findFirst({
    where: { rollNumber: "2024-BIO-015" },
  });
  if (studentMaya) {
    const keyBioCourses = await prisma.course.findMany({
      where: { departmentId: deptBio.id, status: "ACTIVE" },
      take: 12,
    });
    for (const c of keyBioCourses) {
      await prisma.enrollment.upsert({
        where: { studentId_courseId: { studentId: studentMaya.id, courseId: c.id } },
        update: { status: "ENROLLED" },
        create: { studentId: studentMaya.id, courseId: c.id, status: "ENROLLED" },
      });
    }
    console.log(`✅ Enrolled Maya Patel in ${keyBioCourses.length} biology courses`);
  }

  console.log(`🎉 Ingestion Complete! Added: ${createdCount}, Updated: ${updatedCount}, Total catalog items processed: ${BIOLOGY_COURSES.length}`);
}

seedBiologyCourses()
  .catch((e) => {
    console.error("❌ Failed to seed biology courses:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
