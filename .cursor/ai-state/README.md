# AI State Directory

Questa directory contiene file che memorizzano lo stato e le informazioni persistenti per gli assistenti AI che lavorano sul progetto. I file in questa directory non dovrebbero essere modificati manualmente dagli sviluppatori.

## Scopo

L'obiettivo di questa directory è consentire agli assistenti AI di:

1. **Mantenere contesto** tra sessioni di lavoro diverse
2. **Memorizzare informazioni** apprese sull'architettura del progetto
3. **Tracciare decisioni** prese durante lo sviluppo
4. **Registrare componenti esistenti** scoperti durante l'analisi del codice

## File di Stato

I file in questa directory seguono questa convenzione:

- `project-map.json` - Mappa strutturale del progetto scoperta dall'AI
- `component-registry.json` - Registro dei componenti React identificati
- `hooks-registry.json` - Registro degli hook personalizzati identificati
- `services-registry.json` - Registro dei servizi API identificati
- `patterns-discovered.json` - Pattern implementativi identificati
- `decision-log.json` - Registro delle decisioni architetturali prese

## Come Utilizzare

Gli assistenti AI aggiornano automaticamente questi file durante l'analisi del codice. Ciò consente di mantenere la conoscenza del progetto anche tra sessioni diverse, riducendo la necessità di rianalizzare lo stesso codice ripetutamente.

Le informazioni memorizzate qui vengono utilizzate per garantire che:

1. Le soluzioni siano coerenti con l'architettura esistente
2. I componenti vengano riutilizzati invece di essere duplicati
3. I pattern esistenti vengano applicati in modo coerente
4. Le decisioni precedenti vengano rispettate

## Nota per gli Sviluppatori

Si raccomanda di:

- **Non modificare manualmente** i file in questa directory
- **Non eliminare** questa directory o il suo contenuto
- **Non committare** questi file nel repository (sono già nel gitignore)

La perdita di questi file non è critica, ma causerà una temporanea perdita di efficienza degli assistenti AI fino a quando non avranno ricostruito la loro conoscenza del progetto. 