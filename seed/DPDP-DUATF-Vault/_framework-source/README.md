# Framework source

The vault is generated from these data modules, so the team can extend the framework in one place and regenerate:

- `data_legal.py` - sections, rules, schedules, phases, lawful bases
- `data_obligations.py` - atomic obligations + triggers
- `data_controls.py` - control library + crosswalk
- `data_processes_common.py`, `data_sectors.py` - process catalogue & sector overlays
- `data_vocab.py` - vocabularies & data elements
- `data_playbook.py` - methodology, question bank, PBC, stuck-points
- `build_vault.py`, `build_example.py`, `build_xlsx.py` - generators (edit the output paths at the top)

Regenerating overwrites framework notes. Keep client work in `20 Client/`.
