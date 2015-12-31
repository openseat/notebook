#!/usr/bin/env python
# -*- coding: utf-8 -*-
from setuptools import (
    find_packages,
    setup,
)

setup(
    name='openseatnotebook',
    version='0.1.0',
    description='Conceptual Modeling in the IPython Notebook',
    author='Nicholas Bollweg',
    author_email='nicholas.bollweg@gtri.gatech.edu',
    license='New BSD License',
    url='https://github.com/openseat/notebook',
    keywords=('data visualization interactive interaction python ipython'
              ' widgets widget jupyter'),
    install_requires=[
        'ipywidgets',
        'notebook'
    ],
    classifiers=[
        'Development Status :: 4 - Beta',
        'Programming Language :: Python',
        'License :: OSI Approved :: BSD License'
    ],
    packages=find_packages(),
    include_package_data=True
)
