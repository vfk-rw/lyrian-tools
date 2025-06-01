"""
Core scraper modules providing base functionality.
"""
from .fetcher import BaseFetcher
from .parser import BaseParser
from .utils import *

__all__ = ['BaseFetcher', 'BaseParser']