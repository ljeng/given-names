import math
import json
import os
import random
from collections import defaultdict

load = lambda folder, filename: json.load(open(os.path.join('..',
    'json',
    folder,
    filename + '.json'), 'r'))

def merge(file_selection, k):
    normalized_dict = dict()
    for file in ['sex', 'birth_year']:
        normalized_dict[file] = load('normalized', file)
    sum_dict = dict()
    for file in ['sex', 'birth_year']:
        sum_dict[file] = load('sum', file)
    sorted_dict = dict()
    for file in ['sex', 'birth_year']:
        sorted_dict[file] = load('sorted', file)
    weight_dict = defaultdict(lambda: defaultdict(float))
    memo = defaultdict(lambda: defaultdict(float))
    sublists = []
    for file, selection in file_selection.items():
        superlist = []
        if len(selection) > 1:
            supermap1 = defaultdict(float)
            n = 0
            for x in selection:
                for pair in sorted_dict[file][x]:
                    supermap1[pair[0]]
                n += sum_dict[file][x]
            weight_dict[file] = {x: sum_dict[file][x] / n for x in selection}
            for x in selection:
                for name in supermap1:
                    if name in normalized_dict[file][x]:
                        supermap1[name] += weight_dict[file][x] * normalized_dict[file][x][name]
            for name in supermap1:
                superlist.append(name)
                memo[file][name] = supermap1[name]
        else:
            for name, _ in sorted_dict[file][selection[0]]:
                superlist.append(name)
                memo[file][name] = _
        sublists.append(superlist)
    supermap2 = defaultdict(lambda: defaultdict(float))
    for file, selection in file_selection.items():
        for sublist in sublists:
            for name in sublist:
                    if name in memo[file] and memo[file][name]:
                        supermap2[file][name] = memo[file][name]
                    else:
                        for x in selection:
                            increment = weight_dict[file][x]
                            if name in normalized_dict[file][x]:
                                increment *= normalized_dict[file][x][name]
                            supermap2[file][name] += increment
    name_multiplier = dict()
    for name in sublist:
        name_multiplier[name] = 1
        for file in file_selection.keys():
            name_multiplier[name] *= supermap2[file][name]
    name_multiplier_list = sorted([(name, multiplier) for name, multiplier in name_multiplier.items()], key = lambda x: x[1], reverse=True)[:k]
    return name_multiplier_list

k = 10


file_birthYear = 'birth_year'
selection_birthYear = list(map(str, range(1991, 1993)))
# sublist_birthYear = getSupermap(file_birthYear, selection_birthYear)
# print(submap_birthYear)

file_sex = 'sex'
selection_sex = ['female']
# sublist_sex = getSupermap(file_sex, selection_sex)
# print(submap_sex)


file_selection = {file_birthYear: selection_birthYear, file_sex: selection_sex}
# sublists = [sublist_birthYear, sublist_sex]
merged = merge(file_selection, k)
print(merged)