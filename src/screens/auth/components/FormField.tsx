import { forwardRef } from "react";
import { Text, TextInput, TextInputProps, View } from "react-native";

type FormFieldProps = TextInputProps & {
  label: string;
  error?: string | null;
};

export const FormField = forwardRef<TextInput, FormFieldProps>(
  ({ label, error, className = "", ...rest }, ref) => {
    return (
      <View className="gap-2">
        <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
          {label}
        </Text>
        <TextInput
          ref={ref}
          placeholderTextColor="#9ca3af"
          className={`rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-base text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white ${className}`}
          {...rest}
        />
        {error ? (
          <Text className="text-sm text-rose-500" role="alert">
            {error}
          </Text>
        ) : null}
      </View>
    );
  },
);

FormField.displayName = "FormField";


