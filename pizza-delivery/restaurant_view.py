import pygame
import sys
from enum import Enum

# États possibles pour une table
class TableState(Enum):
    FREE = "Libre"
    WAITING_ORDER = "En attente de commande"
    CONSUMING = "En train de consommer"
    CLEARING = "À débarrasser"

# Couleurs
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
GRAY = (128, 128, 128)
RED = (255, 0, 0)
GREEN = (0, 255, 0)
BLUE = (0, 0, 255)
YELLOW = (255, 255, 0)

class Furniture:
    def __init__(self, x, y, width, height, furniture_type):
        self.x = x
        self.y = y
        self.width = width
        self.height = height
        self.type = furniture_type
        self.selected = False
        self.table_number = None
        self.state = TableState.FREE
        self.occupied_chairs = set()  # Pour les chaises occupées

    def draw(self, screen, cell_size):
        color = BLUE if self.selected else BLACK
        if self.type == "small_table":
            if self.state == TableState.FREE:
                color = GREEN
            elif self.state == TableState.WAITING_ORDER:
                color = YELLOW
            elif self.state == TableState.CONSUMING:
                color = BLUE
            elif self.state == TableState.CLEARING:
                color = RED
        
        rect = pygame.Rect(self.x * cell_size, self.y * cell_size,
                          self.width * cell_size, self.height * cell_size)
        pygame.draw.rect(screen, color, rect)
        
        # Afficher le numéro de table
        if self.type in ["small_table", "large_table"] and self.table_number is not None:
            font = pygame.font.Font(None, 24)
            text = font.render(str(self.table_number), True, WHITE)
            text_rect = text.get_rect(center=(rect.centerx, rect.centery))
            screen.blit(text, text_rect)

    def contains_point(self, x, y):
        return (self.x <= x < self.x + self.width and
                self.y <= y < self.y + self.height)

class RestaurantView:
    def __init__(self):
        pygame.init()
        self.cell_size = 20
        self.grid_size = 32
        self.width = self.grid_size * self.cell_size
        self.height = self.grid_size * self.cell_size
        self.screen = pygame.display.set_mode((self.width, self.height))
        pygame.display.set_caption("Vue du Restaurant")

        self.furniture = []
        self.selected_furniture = None
        self.table_counter = 1
        self.selected_group = []

    def add_furniture(self, x, y, furniture_type):
        if furniture_type == "chair":
            new_furniture = Furniture(x, y, 1, 1, "chair")
        elif furniture_type == "small_table":
            new_furniture = Furniture(x, y, 2, 2, "small_table")
            new_furniture.table_number = self.table_counter
            self.table_counter += 1
        elif furniture_type == "large_table":
            new_furniture = Furniture(x, y, 8, 8, "large_table")
            new_furniture.table_number = self.table_counter
            self.table_counter += 1
        
        # Vérifier si l'emplacement est libre
        for furniture in self.furniture:
            if any(furniture.contains_point(px, py) 
                  for px in range(x, x + new_furniture.width)
                  for py in range(y, y + new_furniture.height)):
                return False
        
        self.furniture.append(new_furniture)
        return True

    def get_cell_coordinates(self, pos):
        x, y = pos
        return x // self.cell_size, y // self.cell_size

    def draw_grid(self):
        self.screen.fill(WHITE)
        for x in range(0, self.width, self.cell_size):
            pygame.draw.line(self.screen, GRAY, (x, 0), (x, self.height))
        for y in range(0, self.height, self.cell_size):
            pygame.draw.line(self.screen, GRAY, (0, y), (self.width, y))

    def run(self):
        placing_furniture = None
        
        while True:
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    pygame.quit()
                    sys.exit()

                elif event.type == pygame.KEYDOWN:
                    if event.key == pygame.K_c:
                        placing_furniture = "chair"
                    elif event.key == pygame.K_s:
                        placing_furniture = "small_table"
                    elif event.key == pygame.K_l:
                        placing_furniture = "large_table"
                    elif event.key == pygame.K_DELETE:
                        if self.selected_furniture:
                            self.furniture.remove(self.selected_furniture)
                            self.selected_furniture = None
                    elif event.key == pygame.K_g:  # Grouper les meubles sélectionnés
                        if self.selected_furniture and self.selected_furniture not in self.selected_group:
                            self.selected_group.append(self.selected_furniture)
                    elif event.key == pygame.K_SPACE:  # Changer l'état de la table
                        if self.selected_furniture and self.selected_furniture.type in ["small_table", "large_table"]:
                            states = list(TableState)
                            current_index = states.index(self.selected_furniture.state)
                            next_index = (current_index + 1) % len(states)
                            self.selected_furniture.state = states[next_index]

                elif event.type == pygame.MOUSEBUTTONDOWN:
                    x, y = self.get_cell_coordinates(event.pos)
                    
                    if event.button == 1:  # Clic gauche
                        if placing_furniture:
                            self.add_furniture(x, y, placing_furniture)
                            placing_furniture = None
                        else:
                            # Sélection d'un meuble
                            self.selected_furniture = None
                            for furniture in self.furniture:
                                if furniture.contains_point(x, y):
                                    if furniture.type == "chair":
                                        # Pour les chaises près d'une table, gérer l'occupation
                                        for table in self.furniture:
                                            if (table.type in ["small_table", "large_table"] and
                                                abs(furniture.x - table.x) <= table.width and
                                                abs(furniture.y - table.y) <= table.height):
                                                chair_pos = (furniture.x, furniture.y)
                                                if chair_pos in table.occupied_chairs:
                                                    table.occupied_chairs.remove(chair_pos)
                                                else:
                                                    table.occupied_chairs.add(chair_pos)
                                    self.selected_furniture = furniture
                                    furniture.selected = True
                                else:
                                    furniture.selected = False

            self.draw_grid()
            for furniture in self.furniture:
                furniture.draw(self.screen, self.cell_size)
            
            pygame.display.flip()

if __name__ == "__main__":
    restaurant = RestaurantView()
    restaurant.run()
