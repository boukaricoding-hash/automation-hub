INSERT INTO automations (slug, title, description, category, level, file_type, platform, requirements, code) VALUES (
  'eteindre-pc',
  'Éteindre le PC en un clic',
  'Un fichier qui éteint ton PC quand tu double-cliques dessus.',
  'Système',
  'Débutant',
  'bat',
  'Windows',
  'Aucun',
  '@echo off
echo Ton PC va s''eteindre dans 30 secondes...
echo Pour annuler, ouvre une invite de commandes et tape : shutdown /a
shutdown /s /t 30'
);

INSERT INTO automations (slug, title, description, category, level, file_type, platform, requirements, code) VALUES (
  'organiser-fichiers',
  'Organiser automatiquement ses fichiers',
  'Trie ton dossier Téléchargements : images, PDF et vidéos sont rangés chacun dans leur dossier.',
  'Fichiers',
  'Débutant',
  'py',
  'Windows, Mac, Linux',
  'Python 3',
  'from pathlib import Path
import shutil

dossier = Path.home() / "Downloads"
types = {
    "Images": [".jpg", ".png"],
    "PDF": [".pdf"],
    "Videos": [".mp4"],
}

for fichier in dossier.iterdir():
    if fichier.is_file():
        for nom, extensions in types.items():
            if fichier.suffix.lower() in extensions:
                cible = dossier / nom
                cible.mkdir(exist_ok=True)
                shutil.move(str(fichier), str(cible / fichier.name))'
);