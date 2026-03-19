const path = require("path");

/**
 * Coordonnées des zones sur la carte de niveau.
 * Ajuste ces valeurs pour correspondre à ton template (les zones noires).
 *
 * Dimensions du template : 1376 x 768 pixels
 */
const RANK_CARD = {
  /** Chemin vers l'image template (fond + zones noires) */
  templatePath: path.join(__dirname, "../../assets/rank-card-template.png"),

  /** Dimensions de la carte (doivent correspondre au template) */
  width: 1376,
  height: 768,

  /** Zone avatar (cercle à gauche) */
  avatar: {
    centerX: 180,
    centerY: 384,
    radius: 110,
  },

  /** Zone pseudo / username (barre centrale) */
  username: {
    x: 420,
    y: 340,
    maxWidth: 400,
    fontSize: 48,
    fontFamily: "Arial",
    color: "#FFFFFF",
  },

  /** Zone infos principales (rectangle droit - rank, heures, etc.) */
  stats: {
    x: 1000,
    y: 220,
    lineHeight: 52,
    fontSize: 36,
    fontFamily: "Arial",
    color: "#FFFFFF",
  },

  /** Zone barre de progression (en bas) */
  progressBar: {
    x: 420,
    y: 480,
    width: 650,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.6)",
    fillColor: "#E74C3C",
  },

  /** Les 3 petites zones (icônes/stats) en bas à droite - optionnel */
  smallBoxes: [
    { x: 1000, y: 560, width: 100, height: 80 },
    { x: 1120, y: 560, width: 100, height: 80 },
    { x: 1240, y: 560, width: 100, height: 80 },
  ],
};

module.exports = { RANK_CARD };
