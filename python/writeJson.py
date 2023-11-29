from collections import defaultdict
import json
import os

sex_map = {'F': 'female', 'M': 'male'}
load = lambda folder, filename: json.load(open(os.path.join('..',
    'json',
    folder,
    filename + '.json'), 'r'))
dump = lambda obj, folder, filename: json.dump(
    obj,
    open(os.path.join('..', 'json', folder, filename + '.json'), 'w'))

def jsonify(folders):
    geo_dict = defaultdict(lambda: defaultdict(int))
    sex_dict = defaultdict(lambda: defaultdict(int))
    birth_year_dict = defaultdict(lambda: defaultdict(int))
    name_sum = defaultdict(float)
    geo_sum = defaultdict(int)
    sex_sum = defaultdict(int)
    birth_year_sum = defaultdict(int)
    for folder in folders:
        path = os.path.join('..', folder)
        for filename in os.listdir(path):
            if filename.endswith('.TXT'):
                for line in open(os.path.join(path, filename), 'r'):
                    geo, sex, birth_year, name, occurrences = line.strip().split(',')
                    occurrences = int(occurrences)
                    geo_dict[geo][name] += occurrences
                    sex_dict[sex_map[sex]][name] += occurrences
                    birth_year_dict[birth_year][name] += occurrences
                    name_sum[name] += occurrences
                    geo_sum[geo] += occurrences
                    sex_sum[sex] += occurrences
                    birth_year_sum[birth_year] += occurrences
    for obj, filename in [
        (geo_dict, 'geo'),
        (sex_dict, 'sex'),
        (birth_year_dict, 'birth_year')]:
        dump(obj, 'count', filename)
    sum_values = sum(name_sum.values())
    dump({k: v / sum_values for k, v in name_sum.items()}, 'sum', 'name')
    for obj, filename in [
        (geo_sum, 'geo'),
        (sex_sum, 'sex'),
        (birth_year_sum, 'birth_year')]:
        dump(obj, 'sum', filename)

def normalize(filename):
    input_dict = load('count', filename)
    divisor_dict = load('sum', 'name')
    sum_values = sum(divisor_dict.values())
    output_dict = defaultdict(lambda: defaultdict(float))
    for superkey, supervalue in input_dict.items():
        sum_supervalues = sum(supervalue.values())
        for subkey, subvalue in supervalue.items():
            output_dict[superkey][subkey] = subvalue / sum_supervalues / divisor_dict[subkey]
    dump(output_dict, 'normalized', filename)

def sortValues(filename):
    obj = defaultdict(lambda: defaultdict(int))
    for superkey, supervalue in load('normalized', filename).items():
        obj[superkey] = sorted(
            [(subkey, subvalue) for subkey, subvalue in supervalue.items()],
            key = lambda x: x[1],
            reverse=True)
    dump(obj, 'sorted', filename)

jsonify(['namesbystate', 'namesbyterritory'])
filenames = ['geo', 'sex', 'birth_year']
for filename in filenames:
    normalize(filename)
    sortValues(filename)