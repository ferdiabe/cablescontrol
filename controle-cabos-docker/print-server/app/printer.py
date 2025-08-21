from abc import ABC, abstractmethod
from jinja2 import Template as JinjaTemplate

class PrinterDriver(ABC):
    """Base class for printer drivers."""

    @abstractmethod
    def send(self, command: str) -> None:
        """Send raw command to the printer."""
        raise NotImplementedError

    def render(self, template_content: str, data: dict) -> str:
        template = JinjaTemplate(template_content)
        return template.render(**data)


class TSPLDriver(PrinterDriver):
    """Driver for TSPL printers."""

    def send(self, command: str) -> None:
        # Placeholder implementation; in production this would write to USB or spooler
        print(command)


def get_driver(language: str) -> PrinterDriver:
    language = language.upper()
    if language == 'TSPL':
        return TSPLDriver()
    raise ValueError(f'Unsupported language: {language}')

