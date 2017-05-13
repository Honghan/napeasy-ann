# Psycho-Env Corpus 
The Psycho-env corpus is produced to facilitate knowledge discovery on correlating mental diseases and environmental factors. 

Update:
* NapEasy Annotator v1.0 has been implemented for supporting browser based annotation. Although it should work for any
web pages, it has been developed and tested on PubMed articles.
* 20 articles have been identified for 4 sub-domains of associating mental illness with environmental factors
* Abstracts of the 20 articles have been annotated and uploaded


## Motivation
As with other diseases, it has been established that mental illnesses are influenced in their origins and pathology by environmental factors. For example, it has been found that higher rates of schizophrenia occur in people of Caribbean origin than ethnically similar white people living in the UK [1]. To date, no complete list of environmental factors for all existing mental illnesses has been compiled that can be used for patient screening and planning treatment strategies [2].

## Corpus Files
1. [20 articles covering 4 sub-domains](20_articles.tsv) - lists the 20 articles and their sub-domains.
The file is tab separated.
```
Url	Domain
https://www.ncbi.nlm.nih.gov/pubmed/11223110	Sunlight to bipolar disorder
https://www.ncbi.nlm.nih.gov/pubmed/12467954	Sunlight to bipolar disorder
...
```

2. [annotation dump](annotations_v1.0.tsv) - contains the annotations on all articles and takes the following format.

The first line is the article url, which follows by a list of annotations of this article (each row describes one annotation).
```csv
https://www.ncbi.nlm.nih.gov/pubmed/12823078
ABSTRACTTEXT:eq(1)	0	589	624	3 times a day during the first week	Data collection method
ABSTRACTTEXT:eq(2)	0	0	160	All outcome measures showed significantly (p <.05) better mood improvement in light-treated patients, resulting in faster responses to antidepressant treatment.	The conclusion/finding
ABSTRACTTEXT:eq(1)	0	231	290	 placebo (exposure to a deactivated negative ion generator)	controlled group treatment
...
```
Essentially, the annotation line is tab-separated and has 6 columns. The columns are explained as follows.

| Parent node selector | Text Node Index | Start Offset | End Offset | Text | Type |
| -------------------- | --------------- | ------------ | ---------- | ---- | ---- |
| ABSTRACTTEXT:eq(1) | 0 | 589 | 624 | 3 times a day during the first week | Data collection method |


### Reference
[1] Fung, WL Alan, Dinesh Bhugra, and Peter B. Jones. "Ethnicity and mental health: the example of schizophrenia in migrant populations across Europe." Psychiatry 5.11 (2006): 396-401.
[2] Rutter, Michael. "How the environment affects mental health."  The British Journal of Psychiatry 
(2005).

