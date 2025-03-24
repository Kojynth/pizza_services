import xml.etree.ElementTree as ET

def generate_graphml():
    # Création de l'élément racine
    graphml = ET.Element("graphml", {
        "xmlns": "http://graphml.graphdrawing.org/xmlns",
        "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
        "xmlns:y": "http://www.yworks.com/xml/graphml",
        "xsi:schemaLocation": "http://graphml.graphdrawing.org/xmlns http://graphml.graphdrawing.org/xmlns/1.1/graphml.xsd"
    })
    
    # Définition des clés pour yEd (affichage des labels et styles)
    key = ET.SubElement(graphml, "key", {
        "id": "d0",
        "for": "node",
        "yfiles.type": "nodegraphics"
    })
    
    graph = ET.SubElement(graphml, "graph", {"id": "G", "edgedefault": "directed"})
    
    # Définition des nœuds avec positionnement et lanes
    nodes = {
        "start": ("Début du process", 100, 100),
        "commande": ("Commande reçue", 100, 200),
        "gateway_verif": ("Commande valide ?", 100, 300),
        "invalide": ("Commande invalide", 50, 400),
        "valide": ("Préparation de la pizza", 150, 400),
        "cuisson": ("Cuisson", 150, 500),
        "emballage": ("Emballage", 150, 600),
        "gateway_choix": ("Livraison ou Retrait ?", 150, 700),
        "retrait": ("Retrait en magasin", 50, 800),
        "remise": ("Remise au client", 50, 900),
        "fin_retrait": ("Fin du process", 50, 1000),
        "livreur": ("Prise en charge par le livreur", 250, 800),
        "livraison": ("Livraison au client", 250, 900),
        "fin_livraison": ("Fin du process", 250, 1000),
        "gateway_parallel": ("Vérifications simultanées", 150, 250)
    }

    edges = [
        ("start", "commande"),
        ("commande", "gateway_parallel"),
        ("gateway_parallel", "gateway_verif"),
        ("gateway_verif", "invalide"),
        ("gateway_verif", "valide"),
        ("valide", "cuisson"),
        ("cuisson", "emballage"),
        ("emballage", "gateway_choix"),
        ("gateway_choix", "retrait"),
        ("retrait", "remise"),
        ("remise", "fin_retrait"),
        ("gateway_choix", "livreur"),
        ("livreur", "livraison"),
        ("livraison", "fin_livraison")
    ]

    # Ajouter les nœuds au GraphML avec les balises yEd et les coordonnées
    for node_id, (label, x, y) in nodes.items():
        node = ET.SubElement(graph, "node", {"id": node_id})
        data = ET.SubElement(node, "data", {"key": "d0"})
        shape_node = ET.SubElement(data, "y:ShapeNode")
        node_label = ET.SubElement(shape_node, "y:NodeLabel")
        node_label.text = label
        geometry = ET.SubElement(shape_node, "y:Geometry", {"x": str(x), "y": str(y), "width": "120", "height": "50"})

    # Ajouter les arêtes (relations entre les nœuds)
    for source, target in edges:
        ET.SubElement(graph, "edge", {"source": source, "target": target})

    # Générer le fichier GraphML
    tree = ET.ElementTree(graphml)
    ET.indent(tree, space="    ")
    tree.write("pizza_process.graphml", encoding="utf-8", xml_declaration=True)
    
    print("Fichier GraphML généré : pizza_process.graphml")

# Exécuter la génération du GraphML
generate_graphml()