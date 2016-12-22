
// replace all model materials with Lambert materials
export const convertMaterialsToLambert = (json) => {
  // override all materials to be Lambert
  for (let i = 0; i < json.materials.length; i++) {
    let mat = json.materials[i]
    if (mat.type === 'MultiMaterial') {
      for (let j = 0; j < mat.materials.length; j++) {
        replaceMaterial(mat.materials[j])
      }
    } else {
      replaceMaterial(json.materials[i])
    }
  }
  function replaceMaterial (materialData) {
    materialData.type = 'MeshLambertMaterial'
    delete materialData.specular
    materialData.shininess = 0
  }
}
